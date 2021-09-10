import { SerializedRecord } from '../../json-serializable';
import { SerializationID } from '../../json-serializer';

export interface SerializedInfraModelDiff extends SerializedRecord {
  readonly componentOperations: SerializationID[],
  readonly componentTransitions: SerializationID[],
  readonly infraModelTransition: SerializationID
}