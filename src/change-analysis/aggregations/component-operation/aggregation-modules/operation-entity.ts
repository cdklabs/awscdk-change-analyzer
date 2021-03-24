import { DependencyRelationship } from "change-cd-iac-models/infra-model";
import { CompOpAggCharacteristics } from "change-cd-iac-models/aggregations";
import { ComponentOperation, OutgoingRelationshipComponentOperation, PropertyComponentOperation } from "change-cd-iac-models/model-diffing";
import { EqualityAggModule } from "../../aggregation-module";

export const operationEntityAggModule = new EqualityAggModule(
    CompOpAggCharacteristics.AFFECTED_ENTITY,
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