import { Component, InfraModel } from '../../../infra-model';
import { ComponentOperation, InfraModelDiff, Transition } from '../../../model-diffing';
import { JSONSerializable, Serialized } from '../../json-serializable';
import { SerializationID } from '../../json-serializer';
import { SerializedInfraModelDiff } from '../../serialized-interfaces/infra-model-diff/serialized-infra-model-diff';

export function infraModelDiffDeserializer(
  obj: Serialized,
  deserialize: (obj: SerializationID) => JSONSerializable,
): JSONSerializable {
  const serialized = obj as SerializedInfraModelDiff;

  return new InfraModelDiff(
    serialized.componentOperations.map(deserialize) as ComponentOperation[],
    serialized.componentTransitions.map(deserialize) as Transition<Component>[],
    deserialize(serialized.infraModelTransition) as Transition<InfraModel>,
  );
}
