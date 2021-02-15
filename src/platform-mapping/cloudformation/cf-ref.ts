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
    
}