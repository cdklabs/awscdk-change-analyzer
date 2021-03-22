import { DependencyRelationship } from "change-cd-iac-models/infra-model";
import { CompOpIGCharacteristics } from "change-cd-iac-models/isomorphic-groups";
import {
    ComponentOperation,
    InsertOutgoingRelationshipComponentOperation,
    OutgoingRelationshipComponentOperation,
    RemoveOutgoingRelationshipComponentOperation,
} from "change-cd-iac-models/model-diffing";
import { EqualityIGModule } from "../../ig-module";

export const dependencyRelationshipSourcePropertyPathV1IGModule = new EqualityIGModule(
    CompOpIGCharacteristics.DEPENDENCY_RELATIONSHIP_SOURCE_PROPERTY_PATH_BEFORE,
    (cOp: ComponentOperation) => {
        if(!(cOp instanceof OutgoingRelationshipComponentOperation) || cOp instanceof InsertOutgoingRelationshipComponentOperation
            || !(cOp.relationshipTransition.v1 instanceof DependencyRelationship))
            return;
        return cOp.relationshipTransition.v1?.sourcePropertyPath.join(' -> ');
    }
);

export const dependencyRelationshipSourcePropertyPathV2IGModule = new EqualityIGModule(
    CompOpIGCharacteristics.DEPENDENCY_RELATIONSHIP_SOURCE_PROPERTY_PATH_AFTER,
    (cOp: ComponentOperation) => {
        if(!(cOp instanceof OutgoingRelationshipComponentOperation) || cOp instanceof RemoveOutgoingRelationshipComponentOperation
            || !(cOp.relationshipTransition.v2 instanceof DependencyRelationship))
            return;
        return cOp.relationshipTransition.v2?.sourcePropertyPath.join('-> ');
    }
);

export const dependencyRelationshipTargetAttributePathV1IGModule = new EqualityIGModule(
    CompOpIGCharacteristics.DEPENDENCY_RELATIONSHIP_TARGET_ATTRIBUTE_PATH_BEFORE,
    (cOp: ComponentOperation) => {
        if(!(cOp instanceof OutgoingRelationshipComponentOperation) || cOp instanceof InsertOutgoingRelationshipComponentOperation
            || !(cOp.relationshipTransition.v1 instanceof DependencyRelationship))
            return;
        return cOp.relationshipTransition.v1?.targetAttributePath.join(', ');
    }
);

export const dependencyRelationshipTargetAttributePathV2IGModule = new EqualityIGModule(
    CompOpIGCharacteristics.DEPENDENCY_RELATIONSHIP_TARGET_ATTRIBUTE_PATH_AFTER,
    (cOp: ComponentOperation) => {
        if(!(cOp instanceof OutgoingRelationshipComponentOperation) || cOp instanceof RemoveOutgoingRelationshipComponentOperation
            || !(cOp.relationshipTransition.v2 instanceof DependencyRelationship))
            return;
        return cOp.relationshipTransition.v2?.targetAttributePath.join(', ');
    }
);