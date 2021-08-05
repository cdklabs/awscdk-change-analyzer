import { PropertyPath } from 'cdk-change-analyzer-models';

export class CFRefInitError extends Error {}

export class CFRef {
  /**
   * Maps cloudformation intrinsic function identifiers to the appropriate function that extracts their references
   */
  public static readRefsInPropertyMapping: Record<string, (path:PropertyPath, value:any) => CFRef[]> = Object.freeze({
    'Ref': (path:PropertyPath, value: any) => [new CFRef(path, value)],
    'Fn::GetAtt': (path:PropertyPath, value: any) => {
      if(Array.isArray(value) && value.length >= 2)
        return [new CFRef(path, value[0], value[1])];
      throw new CFRefInitError('GetAtt does not follow the right structure');
    },
    'Fn::Sub': (path: PropertyPath, value: any) => {
      if(Array.isArray(value)
                && typeof value[0] === 'string'
                && (
                  (typeof value[1] === 'object' && value[1] !== null)
                    || value[1] === undefined
                ))
        return value[0].match(/\$\{[A-Za-z0-9.]*\}/g)
          ?.map(v => v.slice(2,-1))
          .filter(v => !Object.keys(value[1])
            .includes(v),
          ).map(r => new CFRef(path, r)) ?? [];
      throw new CFRefInitError('Fn::Sub does not follow the right structure');
    },
  })

  /**
   * Extracts references of intrinsic functions inside the 'expression' object
   * @param expression the definition of a cloudformation entity
   * @param refPath base path of the definition provided
   * @returns extracted references
   */
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
          ...CFRef.readRefsInExpression(v, newRefPath),
        ];
      }, [] as CFRef[]);
    }
  }

  public readonly sourcePath: PropertyPath;
  public readonly logicalId: string;
  public readonly destPath: PropertyPath;

  constructor(sourcePath: PropertyPath, logicalId: string, destPath?: string) {
    this.sourcePath = sourcePath;
    if((typeof(logicalId) !== 'string' || logicalId.startsWith('AWS::'))){
      throw new CFRefInitError('Invalid Ref');
    }
    this.destPath = (destPath?.split('.') ?? logicalId.split('.').slice(1))
      .map(k => /^(\d*)$/.test(k) ? parseInt(k) : k);
    this.logicalId = logicalId.split('.')[0];
  }

  public getDescription = ():string =>
    `${this.sourcePath.join('.')} -> ${[this.logicalId, ...this.destPath].join('.')}`


}