import { CompOpAggCharacteristics } from "change-analysis-models";
import {
    ComponentOperation,
    PropertyComponentOperation,
} from "change-analysis-models";
import { arraysEqual } from "change-analysis-models";
import { EqualityAggModule } from "../../aggregation-module";
import { stringifyPath } from "./utils";

export const propertyPathV1AggModule = new EqualityAggModule(
    CompOpAggCharacteristics.PROPERTY_PATH_BEFORE,
    (cOp: ComponentOperation) => {
        if(cOp instanceof PropertyComponentOperation && cOp.pathTransition.v1 && !arraysEqual(cOp.pathTransition.v1, cOp.pathTransition.v2 || []))
            return stringifyPath(cOp.pathTransition.v1);
        return;
    }
);

export const propertyPathV2AggModule = new EqualityAggModule(
    CompOpAggCharacteristics.PROPERTY_PATH_AFTER,
    (cOp: ComponentOperation) => {
        if(cOp instanceof PropertyComponentOperation && cOp.pathTransition.v2)
            return stringifyPath(cOp.pathTransition.v2);
        return;
    }
);