import { JSONSerializable } from "../../export/json-serializable";
import { SerializationClasses } from "../../export/serialization-classes";
import { SerializedComponentOperation, SerializedOutgoingRelationshipComponentOperation } from "../../export/serialized-interfaces/infra-model-diff/serialized-component-operation";
import { Component, Relationship } from "../../infra-model";
import { ModelEntity } from "../../infra-model/model-entity";
import { ModelEntityTypes } from "../../infra-model/model-entity-types";
import { Transition } from "../transition";

export enum OperationCertainty {
    ABSOLUTE = 'Absolute',
    PARTIAL = 'Partial'
}

export enum OperationType {
    UPDATE = 'UPDATE',
    INSERT = 'INSERT',
    REMOVE = 'REMOVE',
    REPLACE = 'REPLACE',
    RENAME = 'RENAME'
}

export type OpNodeData = {
    readonly certainty?: OperationCertainty
}

type InternalOpNodeData = {
    readonly type: OperationType
}

export type OpOutgoingNodeReferences = {
    readonly cause?: ComponentOperation,
    readonly componentTransition: Transition<Component>,
}

export abstract class ComponentOperation<ND extends OpNodeData = any, OR extends OpOutgoingNodeReferences = any>
    extends ModelEntity<ND & InternalOpNodeData, OR>
    implements JSONSerializable {

    public get cause(): ComponentOperation | undefined { return this.outgoingNodeReferences.cause; }
    public get componentTransition(): Transition<Component> { return this.outgoingNodeReferences.componentTransition; }
    public get certainty(): OperationCertainty { return this.nodeData.certainty ?? OperationCertainty.ABSOLUTE; }

    constructor(
        nodeData: ND,
        outgoingReferences: OR,
        operationType: OperationType,
    ){
        super(ModelEntityTypes.change, {...nodeData, type: operationType}, outgoingReferences);
    }

    public isDirectChange(): boolean{
        return !this.cause;
    }

    public toSerialized(
        serialize: (obj: JSONSerializable) => number,
    ): SerializedComponentOperation {
        return {
            cause: this.cause ? serialize(this.cause) : undefined,
            certainty: this.certainty,
            componentTransition: serialize(this.componentTransition),
        };
    }
    
    public abstract getSerializationClass(): string;
}

export class InsertComponentOperation extends ComponentOperation {
    constructor(
        nodeData: OpNodeData,
        outgoingReferences: OpOutgoingNodeReferences
    ){ super(nodeData, outgoingReferences, OperationType.INSERT);
        if(this.componentTransition.v1 !== undefined || this.componentTransition.v2 === undefined)
            throw Error("Insert Operation's component transition has to have exclusively version 2");
    }

    public getSerializationClass(): string {
        return SerializationClasses.INSERT_COMPONENT_OPERATION;
    }
}

export class RemoveComponentOperation extends ComponentOperation {
    constructor(
        nodeData: OpNodeData,
        outgoingReferences: OpOutgoingNodeReferences
    ){ super(nodeData, outgoingReferences, OperationType.REMOVE);
        if(this.componentTransition.v1 === undefined || this.componentTransition.v2 !== undefined)
            throw Error("Remove Operation's component transition has to have exclusively version 1");
    }

    public getSerializationClass(): string {
        return SerializationClasses.REMOVE_COMPONENT_OPERATION;
    }
}

export class ReplaceComponentOperation extends ComponentOperation {

    constructor(
        nodeData: OpNodeData,
        outgoingReferences: OpOutgoingNodeReferences
    ){ super(nodeData, outgoingReferences, OperationType.REPLACE);
        if(this.componentTransition.v1 === undefined || this.componentTransition.v2 === undefined)
            throw Error("Replace Operation's component transition has to have both v1 and v2");
    }

    public getSerializationClass(): string {
        return SerializationClasses.REPLACE_COMPONENT_OPERATION;
    }
}

export class RenameComponentOperation extends ComponentOperation {

    constructor(
        nodeData: OpNodeData,
        outgoingReferences: OpOutgoingNodeReferences
    ){ super(nodeData, outgoingReferences, OperationType.RENAME);
        if(this.componentTransition.v1 === undefined || this.componentTransition.v2 === undefined)
            throw Error("Rename Operation's component transition has to have both v1 and v2");
    }

    public getSerializationClass(): string {
        return SerializationClasses.RENAME_COMPONENT_OPERATION;
    }
}

export type RelationshipOpOutgoingNodeReferences = OpOutgoingNodeReferences & {
    readonly relationshipTransition: Transition<Relationship>,
}

export abstract class OutgoingRelationshipComponentOperation extends ComponentOperation<any, RelationshipOpOutgoingNodeReferences> {

    public get relationshipTransition(): Transition<Relationship> { return this.outgoingNodeReferences.relationshipTransition; }

    constructor(
        nodeData: OpNodeData,
        outgoingReferences: RelationshipOpOutgoingNodeReferences,
        operationType: OperationType,
    ){super(nodeData, outgoingReferences, operationType);}

    public toSerialized(
        serialize: (obj: JSONSerializable) => number,
    ): SerializedOutgoingRelationshipComponentOperation {
        return {
            ...super.toSerialized(serialize),
            relationshipTransition: serialize(this.relationshipTransition)
        };
    }
}

export class InsertOutgoingRelationshipComponentOperation extends OutgoingRelationshipComponentOperation {
    constructor(
        nodeData: OpNodeData,
        outgoingReferences: RelationshipOpOutgoingNodeReferences
    ){
        super(nodeData, outgoingReferences, OperationType.INSERT);
        if(this.relationshipTransition.v1 !== undefined || this.relationshipTransition.v2 === undefined)
            throw Error("Insert Operation has to have exclusively version 2");
    }

    public getSerializationClass(): string {
        return SerializationClasses.INSERT_OUTGOING_RELATIONSHIP_COMPONENT_OPERATION;
    }
}

export class RemoveOutgoingRelationshipComponentOperation extends OutgoingRelationshipComponentOperation {
    constructor(
        nodeData: OpNodeData,
        outgoingReferences: RelationshipOpOutgoingNodeReferences
    ){
        super(nodeData, outgoingReferences, OperationType.REMOVE);
        if(this.relationshipTransition.v1 === undefined || this.relationshipTransition.v2 !== undefined)
            throw Error("Remove Operation has to have exclusively version 1");
    }


    public getSerializationClass(): string {
        return SerializationClasses.REMOVE_OUTGOING_RELATIONSHIP_COMPONENT_OPERATION;
    }
}

export class UpdateOutgoingRelationshipComponentOperation extends OutgoingRelationshipComponentOperation {
    constructor(
        nodeData: OpNodeData,
        outgoingReferences: RelationshipOpOutgoingNodeReferences
    ){
        super(nodeData, outgoingReferences, OperationType.UPDATE);
        if(this.relationshipTransition.v1 === undefined || this.relationshipTransition.v2 === undefined)
            throw Error("Update Operation has to have both versions");
    }
    
    public getSerializationClass(): string {
        return SerializationClasses.UPDATE_OUTGOING_RELATIONSHIP_COMPONENT_OPERATION;
    }
}