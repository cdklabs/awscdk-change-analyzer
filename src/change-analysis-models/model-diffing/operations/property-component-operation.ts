import { JSONSerializable, Serialized } from "../../export/json-serializable";
import { SerializationID } from "../../export/json-serializer";
import { SerializationClasses } from "../../export/serialization-classes";
import { SerializedPropertyComponentOperation, SerializedUpdatePropertyComponentOperation } from "../../export/serialized-interfaces/infra-model-diff/serialized-component-operation";
import { Component, ComponentProperty, ComponentUpdateType, PropertyPath } from "../../infra-model";
import { arraysEqual } from "../../utils";
import { Transition, transitionSerializer } from "../transition";
import { ComponentOperation, ComponentOperationOptions } from "./component-operation";

export abstract class PropertyComponentOperation extends ComponentOperation {
    constructor(
        public readonly pathTransition: Transition<PropertyPath>,
        public readonly propertyTransition: Transition<ComponentProperty>,
        componentTransition: Transition<Component>,
        options?: ComponentOperationOptions
    ){
        super(componentTransition, options);
    }

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

    public toSerialized(
        serialize: (obj: JSONSerializable) => number,
        serializeCustom: (obj: any, serializationClass: string, serialized: Serialized) => SerializationID
    ): SerializedPropertyComponentOperation {
        return {
            ...super.toSerialized(serialize, serializeCustom),
            pathTransition: {...this.pathTransition},
            propertyTransition: serializeCustom(
                this.propertyTransition,
                SerializationClasses.TRANSITION,
                transitionSerializer(this.propertyTransition, serialize)
            )
        };
    }
}

export class InsertPropertyComponentOperation extends PropertyComponentOperation {
    public getSerializationClass(): string {
        return SerializationClasses.INSERT_PROPERTY_COMPONENT_OPERATION;
    }
}

export class RemovePropertyComponentOperation extends PropertyComponentOperation {
    public getSerializationClass(): string {
        return SerializationClasses.REMOVE_PROPERTY_COMPONENT_OPERATION;
    }
}

export class UpdatePropertyComponentOperation extends PropertyComponentOperation {
    constructor(
        pathTransition: Transition<Array<string | number>>,
        propertyTransition: Transition<ComponentProperty>,
        componentTransition: Transition<Component>,
        options?: ComponentOperationOptions,
        public readonly innerOperations?: PropertyComponentOperation[],
    ){super(pathTransition, propertyTransition, componentTransition, options);}

    getAllInnerOperations(): PropertyComponentOperation[]{
        if(!this.innerOperations || this.innerOperations.length === 0) {
            return [this];
        }
        return this.innerOperations.flatMap(o =>
            [this, ...(
                o instanceof UpdatePropertyComponentOperation
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

    public getLeaves(): PropertyComponentOperation[] {
        if(!this.innerOperations) return [this];
        return this.innerOperations.flatMap(o => o instanceof UpdatePropertyComponentOperation ? o.getLeaves() : [o]);
    }

    public toSerialized(
        serialize: (obj: JSONSerializable) => number,
        serializeCustom: (obj: any, serializationClass: string, serialized: Serialized) => SerializationID
    ): SerializedUpdatePropertyComponentOperation {
        return {
            ...super.toSerialized(serialize, serializeCustom),
            innerOperations: this.innerOperations?.map(o => serialize(o)),
        };
    }

    public getSerializationClass(): string {
        return SerializationClasses.UPDATE_PROPERTY_COMPONENT_OPERATION;
    }
}

export class MovePropertyComponentOperation extends UpdatePropertyComponentOperation {
    public getSerializationClass(): string {
        return SerializationClasses.MOVE_PROPERTY_COMPONENT_OPERATION;
    }
}