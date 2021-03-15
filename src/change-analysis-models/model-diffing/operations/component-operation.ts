import { JSONSerializable, Serialized } from "../../export/json-serializable";
import { SerializationID } from "../../export/json-serializer";
import { SerializationClasses } from "../../export/serialization-classes";
import { SerializedComponentOperation, SerializedOutgoingRelationshipComponentOperation } from "../../export/serialized-interfaces/infra-model-diff/serialized-component-operation";
import { Component, Relationship } from "../../infra-model";
import { Transition, transitionSerializer } from "../transition";

export enum OperationCertainty {
    ABSOLUTE = 'Absolute',
    PARTIAL = 'Partial'
}

export type ComponentOperationOptions = {
    readonly cause?: ComponentOperation | undefined;
    readonly certainty?: OperationCertainty
} 

export abstract class ComponentOperation implements JSONSerializable {
    public readonly cause?: ComponentOperation;
    public readonly certainty: OperationCertainty;
    
    constructor(
        public readonly componentTransition: Transition<Component>,
        options?: ComponentOperationOptions
    ){
        this.certainty = options?.certainty ?? OperationCertainty.ABSOLUTE;
        this.cause = options?.cause;
    }

    public isDirectChange(): boolean{
        return !this.cause;
    }

    public toSerialized(
        serialize: (obj: JSONSerializable) => number,
        serializeCustom: (obj: any, serializationClass: string, serialized: Serialized) => SerializationID
    ): SerializedComponentOperation {
        return {
            cause: this.cause ? serialize(this.cause) : undefined,
            certainty: this.certainty,
            componentTransition: serializeCustom(
                this.componentTransition,
                SerializationClasses.TRANSITION,
                transitionSerializer(this.componentTransition, serialize)
            )
        };
    }
    
    public abstract getSerializationClass(): string;
}

export class InsertComponentOperation extends ComponentOperation {
    constructor(
        public readonly newComponent: Component,
        options?: ComponentOperationOptions
    ){super({v2: newComponent}, options);}

    public getSerializationClass(): string {
        return SerializationClasses.INSERT_COMPONENT_OPERATION;
    }
}

export class RemoveComponentOperation extends ComponentOperation {
    constructor(
        public readonly prevComponent: Component,
        options?: ComponentOperationOptions
    ){super({v1: prevComponent}, options);}

    public getSerializationClass(): string {
        return SerializationClasses.REMOVE_COMPONENT_OPERATION;
    }
}

export class ReplaceComponentOperation extends ComponentOperation {
    public getSerializationClass(): string {
        return SerializationClasses.REPLACE_COMPONENT_OPERATION;
    }
}

export class RenameComponentOperation extends ComponentOperation {
    public getSerializationClass(): string {
        return SerializationClasses.RENAME_COMPONENT_OPERATION;
    }
}

export abstract class OutgoingRelationshipComponentOperation extends ComponentOperation {

    constructor(
        componentTransition: Transition<Component>,
        public readonly relationshipTransition: Transition<Relationship>,
        options?: ComponentOperationOptions
    ){super(componentTransition, options);}

    public toSerialized(
        serialize: (obj: JSONSerializable) => number,
        serializeCustom: (obj: any, serializationClass: string, serialized: Serialized) => SerializationID
    ): SerializedOutgoingRelationshipComponentOperation {
        return {
            ...super.toSerialized(serialize, serializeCustom),
            relationshipTransition: serializeCustom(
                this.relationshipTransition,
                SerializationClasses.TRANSITION,
                transitionSerializer(this.relationshipTransition, serialize)
            )
        };
    }
}

export class InsertOutgoingRelationshipComponentOperation extends OutgoingRelationshipComponentOperation {
    constructor(
        componentTransition: Transition<Component>,
        relationship: Relationship,
        options?: ComponentOperationOptions
    ){super(componentTransition, {v2: relationship}, options);}

    public getSerializationClass(): string {
        return SerializationClasses.INSERT_OUTGOING_RELATIONSHIP_COMPONENT_OPERATION;
    }
}

export class RemoveOutgoingRelationshipComponentOperation extends OutgoingRelationshipComponentOperation {
    constructor(
        componentTransition: Transition<Component>,
        relationship: Relationship,
        options?: ComponentOperationOptions
    ){super(componentTransition, {v1: relationship}, options);}

    public getSerializationClass(): string {
        return SerializationClasses.REMOVE_OUTGOING_RELATIONSHIP_COMPONENT_OPERATION;
    }
}

export class UpdateOutgoingRelationshipComponentOperation extends OutgoingRelationshipComponentOperation {
    public getSerializationClass(): string {
        return SerializationClasses.UPDATE_OUTGOING_RELATIONSHIP_COMPONENT_OPERATION;
    }
}