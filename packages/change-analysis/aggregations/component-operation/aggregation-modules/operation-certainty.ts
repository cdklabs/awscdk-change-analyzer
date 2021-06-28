import { CompOpAggCharacteristics } from "change-analysis-models";
import { ComponentOperation } from "change-analysis-models";
import { EqualityAggModule } from "../../aggregation-module";

export const operationCertaintyAggModule = new EqualityAggModule(
    CompOpAggCharacteristics.OPERATION_CERTAINTY,
    (cOp: ComponentOperation) => {
        return cOp.certainty;
    }
);