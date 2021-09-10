import { Component, StructuralRelationship } from '../../../infra-model';
import { JSONSerializable, Serialized } from '../../json-serializable';
import { SerializationID } from '../../json-serializer';
import { SerializedRelationship } from '../../serialized-interfaces/infra-model/serialized-relationship';

export function structuralRelationshipDeserializer(
  obj: Serialized,
  deserialize: (obj: SerializationID) => JSONSerializable,
): JSONSerializable {
  const serializedStructuralRelationship = obj as SerializedRelationship;

  const target = deserialize(serializedStructuralRelationship.target) as Component;
  const source = deserialize(serializedStructuralRelationship.source) as Component;

  const relationship = new StructuralRelationship(
    source,
    target,
    serializedStructuralRelationship.type,
  );

  source.addOutgoing(relationship);

  return relationship;
}