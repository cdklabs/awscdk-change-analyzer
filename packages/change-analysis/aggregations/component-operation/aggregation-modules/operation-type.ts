import { CompOpAggCharacteristics } from "cdk-change-analyzer-models";
import {
    ComponentOperation
} from "cdk-change-analyzer-models";
import { capitalizeString } from "cdk-change-analyzer-models";
import { EqualityAggModule } from "../../aggregation-module";

export const operationTypeAggModule = new EqualityAggModule(
    CompOpAggCharacteristics.OPERATION_TYPE,
    (cOp: ComponentOperation) => {
        return capitalizeString(cOp.operationType);
    }
);