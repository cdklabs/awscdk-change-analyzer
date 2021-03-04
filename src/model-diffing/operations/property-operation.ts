import { ComponentProperty, ComponentUpdateType, PropertyPath } from "../../infra-model";
import { arraysEqual } from "../../utils";
import { Transition } from "../transition";

export abstract class PropertyOperation {
    constructor(
        public readonly pathTransition: Transition<Array<string | number>>,
        public readonly propertyTransition: Transition<ComponentProperty>
    ){}

    getUpdateType(): ComponentUpdateType{
        if(!this.propertyTransition.v2 && !this.propertyTransition.v1){
            throw Error("Property Operation has no before or after property states");
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this.propertyTransition.v2?.componentUpdateType ?? this.propertyTransition.v1!.componentUpdateType;
    }

    getV1Path(v2path: PropertyPath): PropertyPath | undefined {
        if(this.pathTransition.v1 && this.pathTransition.v2
            && v2path.length >= this.pathTransition.v2.length
            && arraysEqual(v2path, this.pathTransition.v2.slice(0, v2path.length))){
            return [...this.pathTransition.v1, ...v2path.slice(this.pathTransition.v1.length)];
        }
        return;
    }
}

export class InsertPropertyOperation extends PropertyOperation {}

export class RemovePropertyOperation extends PropertyOperation {}

export class UpdatePropertyOperation extends PropertyOperation {
    constructor(
        pathTransition: Transition<Array<string | number>>,
        propertyTransition: Transition<ComponentProperty>,
        public readonly innerOperations?: PropertyOperation[],
    ){super(pathTransition, propertyTransition);}

    getAllInnerOperations(): PropertyOperation[]{
        if(!this.innerOperations || this.innerOperations.length === 0) {
            return [this];
        }
        return this.innerOperations.flatMap(o =>
            [this, ...(
                o instanceof UpdatePropertyOperation
                    ? o.getAllInnerOperations()
                    : [o]
                )
            ]
        );
    }

    getV1Path(v2path: PropertyPath): PropertyPath | undefined {
        const pathFoundSoFar = super.getV1Path(v2path);
        if(pathFoundSoFar){
            if(!this.innerOperations)
                return pathFoundSoFar;
            for(const op of this.innerOperations){
                const p = op.getV1Path(v2path);
                if(p) return p;
            }
        }
        return;
    }
}

export class MovePropertyOperation extends UpdatePropertyOperation {}