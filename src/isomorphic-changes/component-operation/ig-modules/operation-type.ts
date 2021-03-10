import {
    ComponentOperation,
    InsertComponentOperation,
    InsertOutgoingRelationshipComponentOperation,
    PropertyComponentOperation,
    RemoveComponentOperation,
    RemoveOutgoingRelationshipComponentOperation,
    RenameComponentOperation,
    UpdateOutgoingRelationshipComponentOperation
} from "../../../model-diffing";
import { EqualityIGModule } from "../../ig-module";

export const operationTypeIGModule = new EqualityIGModule(
    'Operation Type',
    (cOp: ComponentOperation) => {
        if(cOp instanceof InsertComponentOperation || cOp instanceof InsertOutgoingRelationshipComponentOperation) return 'Insert';
        if(cOp instanceof RemoveComponentOperation || cOp instanceof RemoveOutgoingRelationshipComponentOperation) return 'Remove';
        if(cOp instanceof RenameComponentOperation) return 'Rename';
        if(cOp instanceof PropertyComponentOperation || cOp instanceof UpdateOutgoingRelationshipComponentOperation) return 'Update';
        return 'Unknown';
    } 
);