import { Aggregation } from "change-analysis-models/aggregations";
import { ComponentOperation } from "change-analysis-models/model-diffing";

export function findAggregationWithChange(
    op: ComponentOperation, aggs: Aggregation<ComponentOperation>[]
): Aggregation<ComponentOperation> | undefined {
    for(const agg of aggs){
        if(agg.entities.has(op)){
            if(agg.subAggs){
                const foundInSubAgg = findAggregationWithChange(op, agg.subAggs);
                if(foundInSubAgg) return foundInSubAgg;
            }
            return agg;
        }
    }
    return;
}