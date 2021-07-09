import { CompOpAggCharacteristics, AggCharacteristicValue } from "change-analysis-models";
import { isDefined } from "change-analysis-models";
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

export const dcComponentTypeAndSubtype: AggDescriptionCreator = ({
        [CompOpAggCharacteristics.COMPONENT_TYPE]: type,
        [CompOpAggCharacteristics.COMPONENT_SUBTYPE]: subtype,
    }: Record<string, AggCharacteristicValue>) => {
    return {
        descriptions: [[type, subtype].filter(isDefined).join(' ')],
        describedCharacteristics: [CompOpAggCharacteristics.COMPONENT_TYPE, CompOpAggCharacteristics.COMPONENT_SUBTYPE],
    };
};

export const dcEntityOperation: AggDescriptionCreator = ({
        [CompOpAggCharacteristics.AFFECTED_ENTITY]: entity,
        [CompOpAggCharacteristics.COMPONENT_TYPE]: type,
        [CompOpAggCharacteristics.ENTITY_OPERATION_TYPE]: entityOp,
        [CompOpAggCharacteristics.PROPERTY_PATH_BEFORE]: pathV1,
        [CompOpAggCharacteristics.PROPERTY_PATH_AFTER]: pathV2,
    }: Record<string, AggCharacteristicValue>) => {

    if(pathV1 || pathV2) {
        return {
            descriptions: dcV1vsV2(entityOp ? `Property ${entityOp}` : 'Path', pathV1, pathV2),
            describedCharacteristics: [CompOpAggCharacteristics.AFFECTED_ENTITY, CompOpAggCharacteristics.ENTITY_OPERATION_TYPE, CompOpAggCharacteristics.PROPERTY_PATH_BEFORE, CompOpAggCharacteristics.PROPERTY_PATH_AFTER, CompOpAggCharacteristics.OPERATION_TYPE],
        };
    } else if(!entityOp && !entity){
        return {};
    } else if(entityOp && entity){
        return {
            descriptions: [`${entity === 'Component' ? '' : `${entity} `}${entityOp}`],
            describedCharacteristics: [CompOpAggCharacteristics.AFFECTED_ENTITY, CompOpAggCharacteristics.ENTITY_OPERATION_TYPE, CompOpAggCharacteristics.OPERATION_TYPE],
        };
    } else if(entity) {
        return {
            descriptions: [`${entity === 'Component' && type ? type : entity} changed`],
            describedCharacteristics: [CompOpAggCharacteristics.AFFECTED_ENTITY],
        };
    } else {
        return {
            descriptions: [`${entityOp}`],
            describedCharacteristics: [CompOpAggCharacteristics.AFFECTED_ENTITY],
        };
    }
};

export const dcPropertyValueChange: AggDescriptionCreator = ({
        [CompOpAggCharacteristics.PROPERTY_VALUE_BEFORE]: v1,
        [CompOpAggCharacteristics.PROPERTY_VALUE_AFTER]: v2,
    }: Record<string, AggCharacteristicValue>) => {
    return {
        descriptions: dcV1vsV2('Property value', v1, v2),
        describesCharacteristics: [CompOpAggCharacteristics.PROPERTY_VALUE_BEFORE, CompOpAggCharacteristics.PROPERTY_VALUE_AFTER],
    };
};