export abstract class PropertyOperation {
    constructor(public readonly path: Array<string | number>){}
}

export class InsertPropertyOperation extends PropertyOperation {}

export class RemovePropertyOperation extends PropertyOperation {}

export class UpdatePropertyOperation extends PropertyOperation {
    constructor(
        path: Array<string | number>,
        public readonly innerOperations?: PropertyOperation[],
    ){super(path);}
}
