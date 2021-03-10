import { ComponentOperation, OutgoingRelationshipComponentOperation } from "../../../model-diffing";
import { EqualityIGModule } from "../../ig-module";

export const operationEntityIGModule = new EqualityIGModule(
    'Affected Entity',
    (cOp: ComponentOperation) => {
        if(cOp instanceof OutgoingRelationshipComponentOperation) return 'Relationship';
        return 'Component';
    }
);