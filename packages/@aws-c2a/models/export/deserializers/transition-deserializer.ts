import { Transition } from '../../model-diffing';
import { JSONSerializable, Serialized } from '../json-serializable';
import { SerializationID } from '../json-serializer';
import { SerializedTransition } from '../serialized-interfaces/infra-model-diff/serialized-transition';

export function transitionDeserializer(obj: Serialized, deserialize: (obj: SerializationID) => any): JSONSerializable {
  const serialized = obj as SerializedTransition;

  const deserializeVersion = (version:  SerializationID | {value: Serialized }) =>
    typeof version === 'object' ? version.value : deserialize(version);


  return new Transition({
    v1: serialized.v1 ? deserializeVersion(serialized.v1) : undefined,
    v2: serialized.v2 ? deserializeVersion(serialized.v2) : undefined,
  });
}
