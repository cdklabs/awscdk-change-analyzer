import { JSONSerializable, Serialized } from "../export/json-serializable";
import { SerializationClasses } from "../export/serialization-classes";
import { SerializedChangeAnalysisReport } from "../export/serialized-interfaces/serialized-change-analysis-report";
import { Aggregation, aggregationSerializer } from "../aggregations";
import { ComponentOperation, InfraModelDiff, Transition, UpdatePropertyComponentOperation } from "../model-diffing";
import { Component } from "../infra-model";
import { RuleEffect } from "../rules";

export class ChangeAnalysisReport implements JSONSerializable {

    constructor(
        public readonly infraModelDiff: InfraModelDiff,
        public readonly aggregations: Aggregation<ComponentOperation>[],
        public readonly aggregationsPerComponent: Map<Transition<Component>, Aggregation<ComponentOperation>[]>,
        public readonly rulesOutput: Map<ComponentOperation, RuleEffect>, 
    ){}

    toSerialized(
        serialize: (obj: JSONSerializable) => number,
        serializeCustom: (obj: any, serializationClass: string, serialized: Serialized) => number
    ): SerializedChangeAnalysisReport {
        return {
            infraModelDiff: serialize(this.infraModelDiff),
            aggregations: this.aggregations.map(agg => this.serializeAgg(agg, serialize, serializeCustom)),
            aggregationsPerComponent: Object.fromEntries(
                [...this.aggregationsPerComponent].map(([compTransition, aggArr]) => {
                    return [serialize(compTransition), aggArr.map(agg => this.serializeAgg(agg, serialize, serializeCustom))];
                })
            ),
            rulesOutput: Object.fromEntries(
                [...this.rulesOutput].map(([op, effect]) => [serialize(op), effect])
            )
        };
    }

    private serializeAgg(agg: Aggregation<ComponentOperation>,
        serialize: (obj: JSONSerializable) => number,
        serializeCustom: (obj: any, serializationClass: string, serialized: Serialized) => number){
        return serializeCustom(
            agg,
            SerializationClasses.AGGREGATION,
            aggregationSerializer(agg, serialize, serializeCustom)
        );
    }

    getSerializationClass(): string {
        return SerializationClasses.CHANGE_ANALYSIS_REPORT;
    }
}