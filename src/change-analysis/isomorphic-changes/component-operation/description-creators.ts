import { CompOpIGCharacteristics, IGCharacteristicValue } from "change-cd-iac-models/isomorphic-groups";
import { IGDescriptionCreator } from "../ig-add-descriptions";

/**
 * All exports are automatically used as description creators in the extract-opertaions-igs file
 */  

const dcV1vsV2 = (descriptor: string, v1?: IGCharacteristicValue, v2?: IGCharacteristicValue): string[] => {
    if(!v1 && !v2) return [];

    if(v1 && v2 && v1 !== v2){
        return [`${descriptor}: ${v2} (was ${v1})`];
    } else
        return [`${descriptor}: ${v2 || v1}`];
};

export const dcEntityOperation: IGDescriptionCreator = {
    describesCharacteristics: [CompOpIGCharacteristics.AFFECTED_ENTITY, CompOpIGCharacteristics.ENTITY_OPERATION_TYPE],
    creatorFunction: ({
        [CompOpIGCharacteristics.AFFECTED_ENTITY]: entity,
        [CompOpIGCharacteristics.ENTITY_OPERATION_TYPE]: entityOp,
    }: Record<string, IGCharacteristicValue>): string[] => {
        if(!entityOp && !entity) return [];

        if(entityOp && entity){
            return [`${entity} ${entityOp}`];
        } else if(entity) {
            return [`${entity} changed`];
        } else {
            return [`${entityOp}`];
        }
    }
};

export const dcPropertyPathChange: IGDescriptionCreator = {
    describesCharacteristics: [CompOpIGCharacteristics.PROPERTY_PATH_BEFORE, CompOpIGCharacteristics.PROPERTY_PATH_AFTER],
    creatorFunction: ({
        [CompOpIGCharacteristics.PROPERTY_PATH_BEFORE]: pathV1,
        [CompOpIGCharacteristics.PROPERTY_PATH_AFTER]: pathV2,
    }: Record<string, IGCharacteristicValue>): string[] => {
        return dcV1vsV2('Property path', pathV1, pathV2);
    }
};

export const dcPropertyValueChange: IGDescriptionCreator = {
    describesCharacteristics: [CompOpIGCharacteristics.PROPERTY_VALUE_BEFORE, CompOpIGCharacteristics.PROPERTY_VALUE_AFTER],
        creatorFunction: ({
        [CompOpIGCharacteristics.PROPERTY_VALUE_BEFORE]: v1,
        [CompOpIGCharacteristics.PROPERTY_VALUE_AFTER]: v2,
    }: Record<string, IGCharacteristicValue>): string[] => {
        return dcV1vsV2('Property value', v1, v2);
    }
};

export const dcDependencyRelationshipSourcePathChange: IGDescriptionCreator = {
    describesCharacteristics: [CompOpIGCharacteristics.DEPENDENCY_RELATIONSHIP_SOURCE_PROPERTY_PATH_BEFORE, CompOpIGCharacteristics.DEPENDENCY_RELATIONSHIP_SOURCE_PROPERTY_PATH_BEFORE],
        creatorFunction: ({
        [CompOpIGCharacteristics.DEPENDENCY_RELATIONSHIP_SOURCE_PROPERTY_PATH_BEFORE]: v1,
        [CompOpIGCharacteristics.DEPENDENCY_RELATIONSHIP_SOURCE_PROPERTY_PATH_BEFORE]: v2,
    }: Record<string, IGCharacteristicValue>): string[] => {
        return dcV1vsV2('Referenced in property path', v1, v2);
    }
};

export const dcDependencyRelationshipTargetPathChange: IGDescriptionCreator = {
    describesCharacteristics: [CompOpIGCharacteristics.DEPENDENCY_RELATIONSHIP_TARGET_ATTRIBUTE_PATH_BEFORE, CompOpIGCharacteristics.DEPENDENCY_RELATIONSHIP_TARGET_ATTRIBUTE_PATH_BEFORE],
        creatorFunction: ({
        [CompOpIGCharacteristics.DEPENDENCY_RELATIONSHIP_TARGET_ATTRIBUTE_PATH_BEFORE]: v1,
        [CompOpIGCharacteristics.DEPENDENCY_RELATIONSHIP_TARGET_ATTRIBUTE_PATH_BEFORE]: v2,
    }: Record<string, IGCharacteristicValue>): string[] => {
        return dcV1vsV2('Refers to attribute path', v1, v2);
    }
};