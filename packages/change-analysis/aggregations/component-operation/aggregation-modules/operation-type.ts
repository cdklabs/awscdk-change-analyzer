import { CompOpAggCharacteristics } from "change-analysis-models";
import {
    ComponentOperation
} from "change-analysis-models";
import { capitalizeString } from "change-analysis-models";
import { EqualityAggModule } from "../../aggregation-module";

export const operationTypeAggModule = new EqualityAggModule(
    CompOpAggCharacteristics.OPERATION_TYPE,
    (cOp: ComponentOperation) => {
        return capitalizeString(cOp.operationType);
    }
);