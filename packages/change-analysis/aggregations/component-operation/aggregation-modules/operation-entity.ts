import { CompOpAggCharacteristics } from "change-analysis-models";
import { ComponentOperation, PropertyComponentOperation } from "change-analysis-models";
import { EqualityAggModule } from "../../aggregation-module";

export const operationEntityAggModule = new EqualityAggModule(
    CompOpAggCharacteristics.AFFECTED_ENTITY,
    (cOp: ComponentOperation) => {
        if(cOp instanceof PropertyComponentOperation) return 'Property';
        return 'Component';
    }
);