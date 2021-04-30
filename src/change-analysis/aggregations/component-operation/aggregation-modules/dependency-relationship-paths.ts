import { DependencyRelationship } from "change-cd-iac-models/infra-model";
import { CompOpAggCharacteristics } from "change-cd-iac-models/aggregations";
import {
    ComponentOperation,
    InsertOutgoingRelationshipComponentOperation,
    OutgoingRelationshipComponentOperation,
    RemoveOutgoingRelationshipComponentOperation,
} from "change-cd-iac-models/model-diffing";
import { EqualityAggModule } from "../../aggregation-module";
import { stringifyPath } from "./utils";

export const dependencyRelationshipSourcePropertyPathV1AggModule = new EqualityAggModule(
    CompOpAggCharacteristics.DEPENDENCY_RELATIONSHIP_SOURCE_PROPERTY_PATH_BEFORE,
    (cOp: ComponentOperation) => {
        if(!(cOp instanceof OutgoingRelationshipComponentOperation) || cOp instanceof InsertOutgoingRelationshipComponentOperation
            || !(cOp.relationshipTransition.v1 instanceof DependencyRelationship))
            return;
        return cOp.relationshipTransition.v1 ? stringifyPath(cOp.relationshipTransition.v1.sourcePropertyPath) : undefined;
    }
);

export const dependencyRelationshipSourcePropertyPathV2AggModule = new EqualityAggModule(
    CompOpAggCharacteristics.DEPENDENCY_RELATIONSHIP_SOURCE_PROPERTY_PATH_AFTER,
    (cOp: ComponentOperation) => {
        if(!(cOp instanceof OutgoingRelationshipComponentOperation) || cOp instanceof RemoveOutgoingRelationshipComponentOperation
            || !(cOp.relationshipTransition.v2 instanceof DependencyRelationship))
            return;
        return cOp.relationshipTransition.v2 ? stringifyPath(cOp.relationshipTransition.v2?.sourcePropertyPath) : undefined;
    }
);

export const dependencyRelationshipTargetAttributePathV1AggModule = new EqualityAggModule(
    CompOpAggCharacteristics.DEPENDENCY_RELATIONSHIP_TARGET_ATTRIBUTE_PATH_BEFORE,
    (cOp: ComponentOperation) => {
        if(!(cOp instanceof OutgoingRelationshipComponentOperation) || cOp instanceof InsertOutgoingRelationshipComponentOperation
            || !(cOp.relationshipTransition.v1 instanceof DependencyRelationship))
            return;
        return cOp.relationshipTransition.v1 ? stringifyPath(cOp.relationshipTransition.v1?.targetAttributePath) : undefined;
    }
);

export const dependencyRelationshipTargetAttributePathV2AggModule = new EqualityAggModule(
    CompOpAggCharacteristics.DEPENDENCY_RELATIONSHIP_TARGET_ATTRIBUTE_PATH_AFTER,
    (cOp: ComponentOperation) => {
        if(!(cOp instanceof OutgoingRelationshipComponentOperation) || cOp instanceof RemoveOutgoingRelationshipComponentOperation
            || !(cOp.relationshipTransition.v2 instanceof DependencyRelationship))
            return;
        return cOp.relationshipTransition.v2 ? stringifyPath(cOp.relationshipTransition.v2.targetAttributePath) : undefined;
    }
);