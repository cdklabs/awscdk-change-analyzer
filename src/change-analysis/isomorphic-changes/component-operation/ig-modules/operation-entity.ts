import { CompOpIGCharacteristics } from "change-cd-iac-models/isomorphic-groups";
import { ComponentOperation, OutgoingRelationshipComponentOperation, PropertyComponentOperation } from "change-cd-iac-models/model-diffing";
import { EqualityIGModule } from "../../ig-module";

export const operationEntityIGModule = new EqualityIGModule(
    CompOpIGCharacteristics.AFFECTED_ENTITY,
    (cOp: ComponentOperation) => {
        if(cOp instanceof OutgoingRelationshipComponentOperation) return 'Relationship';
        if(cOp instanceof PropertyComponentOperation) return 'Property';
        return 'Component';
    }
);