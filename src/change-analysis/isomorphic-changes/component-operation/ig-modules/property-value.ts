import { PropertyPrimitive } from "change-cd-iac-models/infra-model";
import { CompOpIGCharacteristics } from "change-cd-iac-models/isomorphic-groups";
import {
    ComponentOperation,
    InsertPropertyComponentOperation,
    PropertyComponentOperation,
    RemovePropertyComponentOperation,
} from "change-cd-iac-models/model-diffing";
import { EqualityIGModule } from "../../ig-module";

export const propertyValueV1IGModule = new EqualityIGModule(
    CompOpIGCharacteristics.PROPERTY_VALUE_BEFORE,
    (cOp: ComponentOperation) => {
        if(!(cOp instanceof PropertyComponentOperation) || cOp instanceof InsertPropertyComponentOperation)
            return;
        const property = cOp.propertyTransition.v1;
        if(property?.isRecord()) return '[Record]';
        if(property?.isArray()) return '[Array]';
        return property?.value as PropertyPrimitive;
    }
);

export const propertyValueV2IGModule = new EqualityIGModule(
    CompOpIGCharacteristics.PROPERTY_VALUE_AFTER,
    (cOp: ComponentOperation) => {
        if(!(cOp instanceof PropertyComponentOperation) || cOp instanceof RemovePropertyComponentOperation)
            return;
        const property = cOp.propertyTransition.v2;
        if(property?.isRecord()) return '[Record]';
        if(property?.isArray()) return '[Array]';
        return property?.value as PropertyPrimitive;
    }
);