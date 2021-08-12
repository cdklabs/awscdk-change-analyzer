import {
  InsertComponentOperation,
  RemoveComponentOperation,
  RenameComponentOperation,
  ReplaceComponentOperation,
} from '../../../../model-diffing/';
import { JSONSerializable, Serialized } from '../../../json-serializable';
import { SerializationID } from '../../../json-serializer';
import { SerializedComponentOperation } from '../../../serialized-interfaces/infra-model-diff/serialized-component-operation';
import { deserializeOpNodeData, deserializeOpOutoingNodeReferences } from './utils';

export function insertComponentOperationDeserializer(
  obj: Serialized,
  deserialize: (obj: SerializationID) => JSONSerializable,
): JSONSerializable {
  const serialized = obj as SerializedComponentOperation;

  return new InsertComponentOperation(
    deserializeOpNodeData(serialized),
    deserializeOpOutoingNodeReferences(serialized, deserialize),
  );
}

export function removeComponentOperationDeserializer(
  obj: Serialized,
  deserialize: (obj: SerializationID) => JSONSerializable,
): JSONSerializable {
  const serialized = obj as SerializedComponentOperation;

  return new RemoveComponentOperation(
    deserializeOpNodeData(serialized),
    deserializeOpOutoingNodeReferences(serialized, deserialize),
  );
}

export function replaceComponentOperationDeserializer(
  obj: Serialized,
  deserialize: (obj: SerializationID) => JSONSerializable,
): JSONSerializable {
  const serialized = obj as SerializedComponentOperation;

  return new ReplaceComponentOperation(
    deserializeOpNodeData(serialized),
    deserializeOpOutoingNodeReferences(serialized, deserialize),
  );
}

export function renameComponentOperationDeserializer(
  obj: Serialized,
  deserialize: (obj: SerializationID) => JSONSerializable,
): JSONSerializable {
  const serialized = obj as SerializedComponentOperation;

  return new RenameComponentOperation(
    deserializeOpNodeData(serialized),
    deserializeOpOutoingNodeReferences(serialized, deserialize),
  );
}