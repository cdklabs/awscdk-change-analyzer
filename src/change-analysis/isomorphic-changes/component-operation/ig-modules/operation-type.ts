import { CompOpIGCharacteristics } from "change-cd-iac-models/isomorphic-groups";
import {
    ComponentOperation,
    InsertComponentOperation,
    OutgoingRelationshipComponentOperation,
    PropertyComponentOperation,
    RemoveComponentOperation,
    RenameComponentOperation,
    ReplaceComponentOperation,
} from "change-cd-iac-models/model-diffing";
import { EqualityIGModule } from "../../ig-module";

export const operationTypeIGModule = new EqualityIGModule(
    CompOpIGCharacteristics.OPERATION_TYPE,
    (cOp: ComponentOperation) => {
        if(cOp instanceof InsertComponentOperation) return 'Insert';
        if(cOp instanceof RemoveComponentOperation) return 'Remove';
        if(cOp instanceof RenameComponentOperation) return 'Rename';
        if(cOp instanceof ReplaceComponentOperation) return 'Replace';
        if(cOp instanceof PropertyComponentOperation
            || cOp instanceof OutgoingRelationshipComponentOperation
        ) return 'Update';
        return;
    } 
);