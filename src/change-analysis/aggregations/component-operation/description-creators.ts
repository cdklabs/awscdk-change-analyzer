import { CompOpAggCharacteristics, AggCharacteristicValue } from "change-cd-iac-models/aggregations";
import { isDefined } from "change-cd-iac-models/utils";
import { AggDescriptionCreator } from "../add-aggregation-descriptions";

/**
 * All exports are automatically used as description creators in the extract-opertaions-aggs file
 */  

const dcV1vsV2 = (descriptor: string, v1?: AggCharacteristicValue, v2?: AggCharacteristicValue): string[] => {
    if(!v1 && !v2) return [];

    if(v1 && v2 && v1 !== v2){
        return [`${descriptor}: ${v2} (was ${v1})`];
    } else
        return [`${descriptor}: ${v2 || v1}`];
};

export const dcComponentTypeAndSubtype: AggDescriptionCreator = {
    describesCharacteristics: [CompOpAggCharacteristics.COMPONENT_TYPE, CompOpAggCharacteristics.COMPONENT_SUBTYPE],
    creatorFunction: ({
        [CompOpAggCharacteristics.COMPONENT_TYPE]: type,
        [CompOpAggCharacteristics.COMPONENT_SUBTYPE]: subtype,
    }: Record<string, AggCharacteristicValue>): string[] => {
        return [[type, subtype].filter(isDefined).join(' ')];
    }
};

export const dcEntityOperation: AggDescriptionCreator = {
    describesCharacteristics: [CompOpAggCharacteristics.AFFECTED_ENTITY, CompOpAggCharacteristics.ENTITY_OPERATION_TYPE],
    creatorFunction: ({
        [CompOpAggCharacteristics.AFFECTED_ENTITY]: entity,
        [CompOpAggCharacteristics.ENTITY_OPERATION_TYPE]: entityOp,
    }: Record<string, AggCharacteristicValue>): string[] => {
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

export const dcPropertyPathChange: AggDescriptionCreator = {
    describesCharacteristics: [CompOpAggCharacteristics.PROPERTY_PATH_BEFORE, CompOpAggCharacteristics.PROPERTY_PATH_AFTER],
    creatorFunction: ({
        [CompOpAggCharacteristics.PROPERTY_PATH_BEFORE]: pathV1,
        [CompOpAggCharacteristics.PROPERTY_PATH_AFTER]: pathV2,
    }: Record<string, AggCharacteristicValue>): string[] => {
        return dcV1vsV2('Property path', pathV1, pathV2);
    }
};

export const dcPropertyValueChange: AggDescriptionCreator = {
    describesCharacteristics: [CompOpAggCharacteristics.PROPERTY_VALUE_BEFORE, CompOpAggCharacteristics.PROPERTY_VALUE_AFTER],
        creatorFunction: ({
        [CompOpAggCharacteristics.PROPERTY_VALUE_BEFORE]: v1,
        [CompOpAggCharacteristics.PROPERTY_VALUE_AFTER]: v2,
    }: Record<string, AggCharacteristicValue>): string[] => {
        return dcV1vsV2('Property value', v1, v2);
    }
};

export const dcDependencyRelationshipSourcePathChange: AggDescriptionCreator = {
    describesCharacteristics: [CompOpAggCharacteristics.DEPENDENCY_RELATIONSHIP_SOURCE_PROPERTY_PATH_BEFORE, CompOpAggCharacteristics.DEPENDENCY_RELATIONSHIP_SOURCE_PROPERTY_PATH_BEFORE],
        creatorFunction: ({
        [CompOpAggCharacteristics.DEPENDENCY_RELATIONSHIP_SOURCE_PROPERTY_PATH_BEFORE]: v1,
        [CompOpAggCharacteristics.DEPENDENCY_RELATIONSHIP_SOURCE_PROPERTY_PATH_BEFORE]: v2,
    }: Record<string, AggCharacteristicValue>): string[] => {
        return dcV1vsV2('Referenced in property path', v1, v2);
    }
};

export const dcDependencyRelationshipTargetPathChange: AggDescriptionCreator = {
    describesCharacteristics: [CompOpAggCharacteristics.DEPENDENCY_RELATIONSHIP_TARGET_ATTRIBUTE_PATH_BEFORE, CompOpAggCharacteristics.DEPENDENCY_RELATIONSHIP_TARGET_ATTRIBUTE_PATH_BEFORE],
        creatorFunction: ({
        [CompOpAggCharacteristics.DEPENDENCY_RELATIONSHIP_TARGET_ATTRIBUTE_PATH_BEFORE]: v1,
        [CompOpAggCharacteristics.DEPENDENCY_RELATIONSHIP_TARGET_ATTRIBUTE_PATH_BEFORE]: v2,
    }: Record<string, AggCharacteristicValue>): string[] => {
        return dcV1vsV2('Refers to attribute path', v1, v2);
    }
};