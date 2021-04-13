import { JSONSerializable, Serialized } from "../export/json-serializable";
import { SerializationClasses } from "../export/serialization-classes";
import { SerializedChangeAnalysisReport } from "../export/serialized-interfaces/serialized-change-analysis-report";
import { Aggregation, aggregationSerializer } from "../aggregations";
import { ComponentOperation, InfraModelDiff } from "../model-diffing";
import * as fn from 'fifinet';
import { ModelEntity } from "../infra-model/model-entity";

export class ChangeAnalysisReport implements JSONSerializable {

    constructor(
        public readonly infraModelDiff: InfraModelDiff,
        public readonly aggregations: Aggregation<ComponentOperation>[]
    ){}


    toSerialized(
        serialize: (obj: JSONSerializable) => number,
        serializeCustom: (obj: any, serializationClass: string, serialized: Serialized) => number
    ): SerializedChangeAnalysisReport {
        return {
            infraModelDiff: serialize(this.infraModelDiff),
            aggregations: this.aggregations.map(ig =>
                serializeCustom(
                    ig,
                    SerializationClasses.AGGREGATION,
                    aggregationSerializer(ig, serialize, serializeCustom)
                )
            )
        };
    }
    getSerializationClass(): string {
        return SerializationClasses.CHANGE_ANALYSIS_REPORT;
    }

    generateGraph() {
        const entities: ModelEntity[] = [...new Set([
            ...this.infraModelDiff.componentOperations.flatMap(op => op.explodeNodeReferences()),
            ...this.infraModelDiff.infraModelTransition.v1?.components.flatMap(op => op.explodeNodeReferences()) ?? [],
            ...this.infraModelDiff.infraModelTransition.v2?.components.flatMap(op => op.explodeNodeReferences()) ?? []
        ])];

        return new fn.Graph(entities.map(e => e.nodeData), entities.flatMap(e => e.getOutgoingNodeEdges()));
    }
    
}