import { Component, ComponentPropertyValue, PropertyPath } from '../../../../infra-model';
import { ComponentOperation, OperationCertainty, OpNodeData, OpOutgoingNodeReferences, PropertyComponentOperation, PropOpOutgoingNodeReferences, Transition, UpdatePropOpOutgoingNodeReferences } from '../../../../model-diffing/';
import { JSONSerializable } from '../../../json-serializable';
import { SerializationID } from '../../../json-serializer';
import { SerializedComponentOperation, SerializedPropertyComponentOperation, SerializedUpdatePropertyComponentOperation } from '../../../serialized-interfaces/infra-model-diff/serialized-component-operation';

export function deserializeOpNodeData(serialized: SerializedComponentOperation): OpNodeData {
  return {
    certainty: OperationCertainty[serialized.certainty as keyof typeof OperationCertainty],
  };
}

export function deserializeOpOutoingNodeReferences(
  serialized: SerializedComponentOperation,
  deserialize: (obj: SerializationID) => JSONSerializable,
): OpOutgoingNodeReferences {
  return {
    cause: serialized.cause ? deserialize(serialized.cause) as ComponentOperation : undefined,
    componentTransition: deserialize(serialized.componentTransition) as Transition<Component>,
  };
}

// PropertyComponentOperations
export function deserializePropOpOutoingNodeReferences(
  serialized: SerializedPropertyComponentOperation,
  deserialize: (obj: SerializationID) => JSONSerializable,
): PropOpOutgoingNodeReferences {
  return {
    ...deserializeOpOutoingNodeReferences(serialized, deserialize),
    pathTransition: deserialize(serialized.pathTransition) as Transition<PropertyPath>,
    propertyTransition: deserialize(serialized.propertyTransition) as Transition<ComponentPropertyValue>,
  };
}

export function deserializeUpdatePropOpOutoingNodeReferences(
  serialized: SerializedUpdatePropertyComponentOperation,
  deserialize: (obj: SerializationID) => JSONSerializable,
): UpdatePropOpOutgoingNodeReferences {
  return {
    ...deserializePropOpOutoingNodeReferences(serialized, deserialize),
    innerOperations: serialized.innerOperations?.map(deserialize) as PropertyComponentOperation[],
  };
}