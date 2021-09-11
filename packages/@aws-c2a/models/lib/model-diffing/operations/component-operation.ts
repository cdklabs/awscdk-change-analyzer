import { JSONSerializable } from '../../export/json-serializable';
import { SerializationClasses } from '../../export/serialization-classes';
import { SerializedComponentOperation } from '../../export/serialized-interfaces/infra-model-diff/serialized-component-operation';
import { Component, ComponentPropertyValue } from '../../infra-model';
import { ModelEntity } from '../../infra-model/model-entity';
import { ModelEntityTypes } from '../../infra-model/model-entity-types';
import { Transition } from '../transition';

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
  readonly type: OperationType,
}

export type OpOutgoingNodeReferences = {
  readonly cause?: ComponentOperation,
  readonly componentTransition: Transition<Component>,
  readonly appliesTo?: ModelEntity[],
}

type InternalOutgoingNodeReferences = {
  readonly appliesTo: ModelEntity[],
  readonly exposesValues: {
    readonly old?: Component | ComponentPropertyValue,
    readonly new?: Component | ComponentPropertyValue
  }
}

export abstract class ComponentOperation<ND extends OpNodeData = any, OR extends OpOutgoingNodeReferences = any>
  extends ModelEntity<ND & InternalOpNodeData, OR & InternalOutgoingNodeReferences>
  implements JSONSerializable {

  public get cause(): ComponentOperation | undefined { return this.outgoingNodeReferences.cause; }
  public get componentTransition(): Transition<Component> { return this.outgoingNodeReferences.componentTransition; }
  public get certainty(): OperationCertainty { return this.nodeData.certainty ?? OperationCertainty.ABSOLUTE; }
  public get operationType(): OperationType { return this.nodeData.type; }

  constructor(
    nodeData: ND,
    outgoingReferences: OR,
    operationType: OperationType,
  ){
    super(
      ModelEntityTypes.change,
      {...nodeData, type: operationType},
      {
        exposesValues: {
          old: outgoingReferences.componentTransition.v1,
          new: outgoingReferences.componentTransition.v2,
        },
        ...outgoingReferences,
        appliesTo: [
          ...(outgoingReferences.appliesTo ?? []),
          ...outgoingReferences.componentTransition.explode(),
        ],
      },
    );
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
    outgoingReferences: OpOutgoingNodeReferences,
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
    outgoingReferences: OpOutgoingNodeReferences,
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
    outgoingReferences: OpOutgoingNodeReferences,
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
    outgoingReferences: OpOutgoingNodeReferences,
  ){ super(nodeData, outgoingReferences, OperationType.RENAME);
    if(this.componentTransition.v1 === undefined || this.componentTransition.v2 === undefined)
      throw Error("Rename Operation's component transition has to have both v1 and v2");
  }

  public getSerializationClass(): string {
    return SerializationClasses.RENAME_COMPONENT_OPERATION;
  }
}