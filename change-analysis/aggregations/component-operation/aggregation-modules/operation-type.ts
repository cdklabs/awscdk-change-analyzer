import { CompOpAggCharacteristics } from "change-cd-iac-models/aggregations";
import {
    ComponentOperation
} from "change-cd-iac-models/model-diffing";
import { capitalizeString } from "change-cd-iac-models/utils";
import { EqualityAggModule } from "../../aggregation-module";

export const operationTypeAggModule = new EqualityAggModule(
    CompOpAggCharacteristics.OPERATION_TYPE,
    (cOp: ComponentOperation) => {
        return capitalizeString(cOp.operationType);
    }
);