import { ChangeAnalysisReport } from "../../change-analysis-report";
import { Aggregation } from "../../aggregations";
import { ComponentOperation, InfraModelDiff, Transition } from "../../model-diffing";
import { JSONSerializable, Serialized } from "../json-serializable";
import { SerializationID } from "../json-serializer";
import { SerializedChangeAnalysisReport } from "../serialized-interfaces/serialized-change-analysis-report";
import { Component } from "../../infra-model";

export function changeAnalysisReportDeserializer(obj: Serialized, deserialize: (obj: SerializationID) => any): JSONSerializable {
    const serialized = obj as SerializedChangeAnalysisReport;

    return new ChangeAnalysisReport(
        deserialize(serialized.infraModelDiff) as InfraModelDiff,
        serialized.aggregations.map(deserialize) as Aggregation<ComponentOperation>[],
        new Map(Object.entries(serialized.aggregationsPerComponent).map(([k,v]) => [deserialize(parseInt(k)) as Transition<Component>, v.map(deserialize) as Aggregation<ComponentOperation>[]])),
        new Map(Object.entries(serialized.rulesOutput).map(([id, effect]) => [deserialize(parseInt(id)), effect]))
    );
}
