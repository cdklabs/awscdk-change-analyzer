import { CompOpAggCharacteristics } from "change-cd-iac-models/aggregations";
import { capitalizeString } from "change-cd-iac-models/utils";
import {
    ComponentOperation, PropertyComponentOperation,
} from "change-cd-iac-models/model-diffing";
import { EqualityAggModule } from "../../aggregation-module";

export const entityOperationTypeAggModule = new EqualityAggModule(
    CompOpAggCharacteristics.ENTITY_OPERATION_TYPE,
    (cOp: ComponentOperation) => {
        return capitalizeString(cOp instanceof PropertyComponentOperation
            ? cOp.propertyOperationType
            : cOp.operationType);
    } 
);