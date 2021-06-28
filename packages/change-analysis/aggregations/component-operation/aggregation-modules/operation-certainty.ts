import { CompOpAggCharacteristics } from "change-cd-iac-models/aggregations";
import { ComponentOperation } from "change-cd-iac-models/model-diffing";
import { EqualityAggModule } from "../../aggregation-module";

export const operationCertaintyAggModule = new EqualityAggModule(
    CompOpAggCharacteristics.OPERATION_CERTAINTY,
    (cOp: ComponentOperation) => {
        return cOp.certainty;
    }
);