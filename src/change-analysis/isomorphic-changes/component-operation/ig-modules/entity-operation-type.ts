import { CompOpIGCharacteristics } from "change-cd-iac-models/isomorphic-groups";
import {
    ComponentOperation,
    InsertComponentOperation,
    InsertOutgoingRelationshipComponentOperation,
    PropertyComponentOperation,
    RemoveComponentOperation,
    RemoveOutgoingRelationshipComponentOperation,
    RenameComponentOperation,
    ReplaceComponentOperation,
    UpdateOutgoingRelationshipComponentOperation
} from "change-cd-iac-models/model-diffing";
import { EqualityIGModule } from "../../ig-module";

export const entityOperationTypeIGModule = new EqualityIGModule(
    CompOpIGCharacteristics.ENTITY_OPERATION_TYPE,
    (cOp: ComponentOperation) => {
        if(cOp instanceof InsertComponentOperation || cOp instanceof InsertOutgoingRelationshipComponentOperation) return 'Insert';
        if(cOp instanceof RemoveComponentOperation || cOp instanceof RemoveOutgoingRelationshipComponentOperation) return 'Remove';
        if(cOp instanceof RenameComponentOperation) return 'Rename';
        if(cOp instanceof ReplaceComponentOperation) return 'Replace';
        if(cOp instanceof PropertyComponentOperation || cOp instanceof UpdateOutgoingRelationshipComponentOperation) return 'Update';
        return;
    } 
);