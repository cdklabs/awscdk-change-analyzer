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

export const operationTypeIGModule = new EqualityIGModule(
    'Operation Type',
    (cOp: ComponentOperation) => {
        if(cOp instanceof InsertComponentOperation || cOp instanceof InsertOutgoingRelationshipComponentOperation) return 'Insert';
        if(cOp instanceof RemoveComponentOperation || cOp instanceof RemoveOutgoingRelationshipComponentOperation) return 'Remove';
        if(cOp instanceof RenameComponentOperation) return 'Rename';
        if(cOp instanceof ReplaceComponentOperation) return 'Replace';
        if(cOp instanceof PropertyComponentOperation || cOp instanceof UpdateOutgoingRelationshipComponentOperation) return 'Update';
        return 'Unknown';
    } 
);