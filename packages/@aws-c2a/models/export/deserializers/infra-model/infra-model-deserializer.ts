import { Component, InfraModel, Relationship } from '../../../infra-model';
import { JSONSerializable, Serialized } from '../../json-serializable';
import { SerializationID } from '../../json-serializer';
import { SerializedInfraModel } from '../../serialized-interfaces/infra-model/serialized-infra-model';

export function infraModelDeserializer(obj: Serialized, deserialize: (obj: SerializationID) => JSONSerializable): JSONSerializable {
  const serializedInfraModel = obj as SerializedInfraModel;

  return new InfraModel(
    serializedInfraModel.components.map(c => deserialize(c) as Component),
    serializedInfraModel.relationships.map(r => deserialize(r) as Relationship),
  );
}