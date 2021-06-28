import { CompOpAggCharacteristics } from "change-analysis-models";
import { capitalizeString } from "change-analysis-models";
import {
    ComponentOperation, PropertyComponentOperation,
} from "change-analysis-models";
import { EqualityAggModule } from "../../aggregation-module";

export const entityOperationTypeAggModule = new EqualityAggModule(
    CompOpAggCharacteristics.ENTITY_OPERATION_TYPE,
    (cOp: ComponentOperation) => {
        return capitalizeString(cOp instanceof PropertyComponentOperation
            ? cOp.propertyOperationType
            : cOp.operationType);
    } 
);