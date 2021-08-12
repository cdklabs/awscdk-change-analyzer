import {
  InsertPropertyComponentOperation,
  MovePropertyComponentOperation,
  RemovePropertyComponentOperation,
} from '../../../../model-diffing/';
import { JSONSerializable, Serialized } from '../../../json-serializable';
import { SerializationID } from '../../../json-serializer';
import { SerializedPropertyComponentOperation } from '../../../serialized-interfaces/infra-model-diff/serialized-component-operation';
import { deserializeOpNodeData, deserializePropOpOutoingNodeReferences, deserializeUpdatePropOpOutoingNodeReferences } from './utils';

export function insertPropertyComponentOperationDeserializer(obj: Serialized, deserialize: (obj: SerializationID) => JSONSerializable): JSONSerializable {
  const serialized = obj as SerializedPropertyComponentOperation;

  return new InsertPropertyComponentOperation(
    deserializeOpNodeData(serialized),
    deserializePropOpOutoingNodeReferences(serialized, deserialize),
  );
}

export function removePropertyComponentOperationDeserializer(obj: Serialized, deserialize: (obj: SerializationID) => JSONSerializable): JSONSerializable {
  const serialized = obj as SerializedPropertyComponentOperation;

  return new RemovePropertyComponentOperation(
    deserializeOpNodeData(serialized),
    deserializePropOpOutoingNodeReferences(serialized, deserialize),
  );
}

export function movePropertyComponentOperationDeserializer(obj: Serialized, deserialize: (obj: SerializationID) => JSONSerializable): JSONSerializable {
  const serialized = obj as SerializedPropertyComponentOperation;

  return new MovePropertyComponentOperation(
    deserializeOpNodeData(serialized),
    deserializePropOpOutoingNodeReferences(serialized, deserialize),
  );
}

export function updatePropertyComponentOperationDeserializer(obj: Serialized, deserialize: (obj: SerializationID) => JSONSerializable): JSONSerializable {
  const serialized = obj as SerializedPropertyComponentOperation;

  return new MovePropertyComponentOperation(
    deserializeOpNodeData(serialized),
    deserializeUpdatePropOpOutoingNodeReferences(serialized, deserialize),
  );
}