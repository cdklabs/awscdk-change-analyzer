import { CompOpAggCharacteristics } from "change-cd-iac-models/aggregations";
import {
    ComponentOperation,
    InsertPropertyComponentOperation,
    MovePropertyComponentOperation,
    RemovePropertyComponentOperation,
    UpdatePropertyComponentOperation
} from "change-cd-iac-models/model-diffing";
import { EqualityAggModule } from "../../aggregation-module";

export const entityOperationTypeAggModule = new EqualityAggModule(
    CompOpAggCharacteristics.ENTITY_OPERATION_TYPE,
    (cOp: ComponentOperation) => {
        if(cOp instanceof InsertPropertyComponentOperation) return 'Insert';
        if(cOp instanceof RemovePropertyComponentOperation) return 'Remove';
        if(cOp instanceof UpdatePropertyComponentOperation) return 'Update';
        if(cOp instanceof MovePropertyComponentOperation) return 'Rename';
        return;
    } 
);