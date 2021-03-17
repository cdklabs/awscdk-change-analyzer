import { JSONSerializable, Serialized } from "../export/json-serializable";
import { SerializationClasses } from "../export/serialization-classes";
import { SerializedChangeAnalysisReport } from "../export/serialized-interfaces/serialized-change-analysis-report";
import { IsomorphicGroup, isomorphicGroupSerializer } from "../isomorphic-groups";
import { ComponentOperation, InfraModelDiff } from "../model-diffing";

export class ChangeAnalysisReport implements JSONSerializable {

    constructor(
        public readonly infraModelDiff: InfraModelDiff,
        public readonly isomorphicGroups: IsomorphicGroup<ComponentOperation>[]
    ){}


    toSerialized(
        serialize: (obj: JSONSerializable) => number,
        serializeCustom: (obj: any, serializationClass: string, serialized: Serialized) => number
    ): SerializedChangeAnalysisReport {
        return {
            infraModelDiff: serialize(this.infraModelDiff),
            isomorphicGroups: this.isomorphicGroups.map(ig =>
                serializeCustom(
                    ig,
                    SerializationClasses.ISOMORPHIC_GROUP,
                    isomorphicGroupSerializer(ig, serialize, serializeCustom)
                )
            )
        };
    }
    getSerializationClass(): string {
        return SerializationClasses.CHANGE_ANALYSIS_REPORT;
    }
    
}