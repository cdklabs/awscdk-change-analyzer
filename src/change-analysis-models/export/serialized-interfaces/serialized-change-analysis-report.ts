import { SerializedRecord } from "../json-serializable";
import { SerializationID } from "../json-serializer";

export interface SerializedChangeAnalysisReport extends SerializedRecord {
    readonly infraModelDiff: SerializationID,
    readonly isomorphicGroups: SerializationID[],
}