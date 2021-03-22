import { CompOpIGCharacteristics } from "change-cd-iac-models/isomorphic-groups";
import {
    ComponentOperation,
    InsertOutgoingRelationshipComponentOperation,
    InsertPropertyComponentOperation,
    MovePropertyComponentOperation,
    RemoveOutgoingRelationshipComponentOperation,
    RemovePropertyComponentOperation,
    UpdateOutgoingRelationshipComponentOperation,
    UpdatePropertyComponentOperation
} from "change-cd-iac-models/model-diffing";
import { EqualityIGModule } from "../../ig-module";

export const entityOperationTypeIGModule = new EqualityIGModule(
    CompOpIGCharacteristics.ENTITY_OPERATION_TYPE,
    (cOp: ComponentOperation) => {
        if(cOp instanceof InsertPropertyComponentOperation || cOp instanceof InsertOutgoingRelationshipComponentOperation) return 'Insert';
        if(cOp instanceof RemovePropertyComponentOperation || cOp instanceof RemoveOutgoingRelationshipComponentOperation) return 'Remove';
        if(cOp instanceof UpdatePropertyComponentOperation || cOp instanceof UpdateOutgoingRelationshipComponentOperation) return 'Update';
        if(cOp instanceof MovePropertyComponentOperation) return 'Rename';
        return;
    } 
);