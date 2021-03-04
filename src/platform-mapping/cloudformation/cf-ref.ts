export class CFRefInitError extends Error {}

export class CFRef {

    sourcePath: PropertyPath;
    logicalId: string;
    destPath: PropertyPath;

    constructor(sourcePath: PropertyPath, logicalId: string, destPath?: string) {
        this.sourcePath = CFRef.excludeExpressionFromPath(sourcePath);
        if((typeof(logicalId) !== 'string' || logicalId.startsWith('AWS::'))){
            throw new CFRefInitError("Invalid Ref");
        }
        this.destPath = CFRef.excludeExpressionFromPath(
            (destPath?.split('.') ?? logicalId.split('.').slice(1))
                .map(k => /^(\d*)$/.test(k) ? parseInt(k) : k)
        );
        this.logicalId = logicalId.split('.')[0];
    }

    public getDescription = ():string => 
        `${this.sourcePath.join('.')} -> ${[this.logicalId, ...this.destPath].join('.')}`


    public static readRefsInPropertyMapping: Record<string, (path:PropertyPath, value:any) => CFRef[]> = Object.freeze({
        'Ref': (path:PropertyPath, value: any) => [new CFRef(path, value)],
        'Fn::GetAtt': (path:PropertyPath, value: any) => {
            if(Array.isArray(value) && value.length >= 2)
                return [new CFRef(path, value[0], value[1])];
            throw new CFRefInitError("GetAtt does not follow the right structure");
        },
        'Fn::Sub': (path: PropertyPath, value: any) => {
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
                ).map(r => new CFRef(path, r)); 
            throw new CFRefInitError("Fn::Sub does not follow the right structure");
        }
    })

    public static readRefsInExpression = (expression: any, refPath?: PropertyPath): CFRef[] => {
        if(typeof(expression) !== 'object' || expression == null)
            return [];
        else {
            return Object.entries(expression).reduce((acc, [k, v]) => {
                const key = Array.isArray(expression) ? parseInt(k) : k;
                const newRefPath = refPath ? [...refPath, key] : [key];
                let refs: CFRef[] = [];
                if(CFRef.readRefsInPropertyMapping[key]){
                    try{
                        refs = CFRef.readRefsInPropertyMapping[key](newRefPath, v);
                    } catch (e) {
                        if(!(e instanceof CFRefInitError)) throw e;
                    }
                }
                return [
                    ...acc,
                    ...refs,
                    ...CFRef.readRefsInExpression(v, newRefPath)
                ];
            }, [] as CFRef[]);
        }
    }

    private static excludeExpressionFromPath(path: PropertyPath){
        for(let i = 0; i < path.length; i++){
            const key = path[i];
            if(typeof key === 'string' && (key.startsWith("Fn::") || key === "Ref")){
                return (i === 0) ? [] : path.slice(0, i);
            }
        }
        return path;
    }
    
}