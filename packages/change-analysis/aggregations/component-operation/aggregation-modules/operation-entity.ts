import { CompOpAggCharacteristics } from "change-cd-iac-models/aggregations";
import { ComponentOperation, PropertyComponentOperation } from "change-cd-iac-models/model-diffing";
import { EqualityAggModule } from "../../aggregation-module";

export const operationEntityAggModule = new EqualityAggModule(
    CompOpAggCharacteristics.AFFECTED_ENTITY,
    (cOp: ComponentOperation) => {
        if(cOp instanceof PropertyComponentOperation) return 'Property';
        return 'Component';
    }
);