import { PropertyPrimitive } from "change-cd-iac-models/infra-model";
import {
    ComponentOperation,
    PropertyComponentOperation,
} from "change-cd-iac-models/model-diffing";
import { EqualityIGModule } from "../../ig-module";

export const propertyValueV1IGModule = new EqualityIGModule(
    'Property Value Before',
    (cOp: ComponentOperation) => {
        if(!(cOp instanceof PropertyComponentOperation))
            return '[Unknown]';
        const property = cOp.propertyTransition.v1;
        if(property?.isRecord()) return '[Record]';
        if(property?.isArray()) return '[Array]';
        return property
            ? property.value as PropertyPrimitive :
            '[Unknown]';
    } 
);

export const propertyValueV2IGModule = new EqualityIGModule(
    'Property Value After',
    (cOp: ComponentOperation) => {
        if(!(cOp instanceof PropertyComponentOperation))
            return '[Unknown]';
        const property = cOp.propertyTransition.v2;
        if(property?.isRecord()) return '[Record]';
        if(property?.isArray()) return '[Array]';
        return property
            ? property.value as PropertyPrimitive :
            '[Unknown]';
    } 
);