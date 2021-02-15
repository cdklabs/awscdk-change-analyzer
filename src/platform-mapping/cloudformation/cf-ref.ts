export class CFRefInitError extends Error {}

export class CFRef {

    sourcePath: string[]
    logicalId: string
    destPath: string[]

    constructor(sourcePath: string[], logicalId: string, destPath?: string) {
        this.sourcePath = sourcePath
        if((typeof(logicalId) !== 'string' || logicalId.startsWith('AWS::'))){
            throw new CFRefInitError("Invalid Ref")
        }
        this.destPath = destPath?.split('.') ?? logicalId.split('.').slice(1)
        this.logicalId = logicalId.split('.')[0]
    }

    getDescription = ():string => 
        `${this.sourcePath.join('.')} -> ${[this.logicalId, ...this.destPath].join('.')}`


    static readRefsInPropertyMapping: Record<string, (path:string[], value:any) => CFRef[]> = Object.freeze({
        'Ref': (path:string[], value: any) => [new CFRef(path, value)],
        'Fn::GetAtt': (path:string[], value: any) => {
            if(Array.isArray(value) && value.length >= 2)
                return [new CFRef(path, value[0], value[1])]
            throw new CFRefInitError("GetAtt does not follow the right structure")
        },
        'Fn::Sub': (path: string[], value: any) => {
            if(Array.isArray(value)
                && typeof value[0] === 'string'
                && (
                    (typeof value[1] === 'object' && value[1] !== null)
                    || value[1] === undefined
            ))
                return [...value[0].matchAll(/\$\{[A-Za-z0-9.]*\}/g)]
                    .map(v => v[0].slice(2,-1))
                    .filter(v => !Object.keys(value[1])
                    .includes(v)
                ).map(r => new CFRef(path, r)) 
            throw new CFRefInitError("Fn::Sub does not follow the right structure")
        }
    })

    static readRefsInExpression = (expression: any, refPath?: string[]): CFRef[] => {
        if(typeof(expression) !== 'object' || expression == null)
            return []
        else {
            return Object.entries(expression).reduce((acc, [k, v]) => {
                const newRefPath = refPath ? [...refPath,k] : [k]
                let refs: CFRef[] = []
                if(CFRef.readRefsInPropertyMapping[k]){
                    try{
                        refs = CFRef.readRefsInPropertyMapping[k](newRefPath, v)
                    } catch (e) {
                        if(!(e instanceof CFRefInitError)) throw e
                    }
                }
                return [
                    ...acc,
                    ...refs,
                    ...CFRef.readRefsInExpression(v, newRefPath)
                ]
            }, [] as CFRef[])
        }
    }
    
}