import { PropertyPrimitive } from "cdk-change-analyzer-models";
import { CompOpAggCharacteristics } from "cdk-change-analyzer-models";
import {
    ComponentOperation,
    InsertPropertyComponentOperation,
    PropertyComponentOperation,
    RemovePropertyComponentOperation,
} from "cdk-change-analyzer-models";
import { EqualityAggModule } from "../../aggregation-module";

export const propertyValueV1AggModule = new EqualityAggModule(
    CompOpAggCharacteristics.PROPERTY_VALUE_BEFORE,
    (cOp: ComponentOperation) => {
        if(!(cOp instanceof PropertyComponentOperation) || cOp instanceof InsertPropertyComponentOperation)
            return;
        const property = cOp.propertyTransition.v1;
        if(property?.isRecord()) return '[Record]';
        if(property?.isArray()) return '[Array]';
        return property?.value as PropertyPrimitive;
    }
);

export const propertyValueV2AggModule = new EqualityAggModule(
    CompOpAggCharacteristics.PROPERTY_VALUE_AFTER,
    (cOp: ComponentOperation) => {
        if(!(cOp instanceof PropertyComponentOperation) || cOp instanceof RemovePropertyComponentOperation)
            return;
        const property = cOp.propertyTransition.v2;
        if(property?.isRecord()) return '[Record]';
        if(property?.isArray()) return '[Array]';
        return property?.value as PropertyPrimitive;
    }
);