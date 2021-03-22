import { DependencyRelationship } from "change-cd-iac-models/infra-model";
import { CompOpIGCharacteristics } from "change-cd-iac-models/isomorphic-groups";
import { ComponentOperation, OutgoingRelationshipComponentOperation, PropertyComponentOperation } from "change-cd-iac-models/model-diffing";
import { EqualityIGModule } from "../../ig-module";

export const operationEntityIGModule = new EqualityIGModule(
    CompOpIGCharacteristics.AFFECTED_ENTITY,
    (cOp: ComponentOperation) => {
        if(cOp instanceof OutgoingRelationshipComponentOperation){
            return cOp.relationshipTransition.v2 ?? cOp.relationshipTransition.v1 instanceof DependencyRelationship
                ? 'Dependency Relationship'
                : 'Structural Relationship';
        }
        if(cOp instanceof PropertyComponentOperation) return 'Property';
        return;
    }
);