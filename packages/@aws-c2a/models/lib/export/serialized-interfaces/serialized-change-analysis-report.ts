import { RuleEffect } from '../../rules';
import { SerializedRecord } from '../json-serializable';
import { SerializationID } from '../json-serializer';

export interface SerializedChangeAnalysisReport extends SerializedRecord {
  readonly infraModelDiff: SerializationID,
  readonly aggregations: SerializationID[],
  readonly aggregationsPerComponent: Record<SerializationID, SerializationID[]>,
  readonly rulesOutput: Record<SerializationID, RuleEffect>,
}