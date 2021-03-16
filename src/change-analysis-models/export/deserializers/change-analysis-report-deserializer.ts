import { ChangeAnalysisReport } from "../../change-analysis-report";
import { IsomorphicGroup } from "../../isomorphic-groups";
import { ComponentOperation, InfraModelDiff } from "../../model-diffing";
import { JSONSerializable, Serialized } from "../json-serializable";
import { SerializationID } from "../json-serializer";
import { SerializedChangeAnalysisReport } from "../serialized-interfaces/serialized-change-analysis-report";

export function changeAnalysisReportDeserializer(obj: Serialized, deserialize: (obj: SerializationID) => any): JSONSerializable {
    const serialized = obj as SerializedChangeAnalysisReport;

    return new ChangeAnalysisReport(
        deserialize(serialized.infraModelDiff) as InfraModelDiff,
        serialized.isomorphicGroups.map(ig => deserialize(ig)) as IsomorphicGroup<ComponentOperation>[]
    );
}
