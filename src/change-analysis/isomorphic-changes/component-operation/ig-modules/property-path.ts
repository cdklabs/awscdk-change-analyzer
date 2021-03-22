import { CompOpIGCharacteristics } from "change-cd-iac-models/isomorphic-groups";
import {
    ComponentOperation,
    PropertyComponentOperation,
} from "change-cd-iac-models/model-diffing";
import { arraysEqual } from "change-cd-iac-models/utils";
import { EqualityIGModule } from "../../ig-module";

export const propertyPathV1IGModule = new EqualityIGModule(
    CompOpIGCharacteristics.PROPERTY_PATH_BEFORE,
    (cOp: ComponentOperation) => {
        if(cOp instanceof PropertyComponentOperation && cOp.pathTransition.v1 && !arraysEqual(cOp.pathTransition.v1, cOp.pathTransition.v2 || []))
            return cOp.pathTransition.v1.join(' -> ');
        return;
    }
);

export const propertyPathV2IGModule = new EqualityIGModule(
    CompOpIGCharacteristics.PROPERTY_PATH_AFTER,
    (cOp: ComponentOperation) => {
        if(cOp instanceof PropertyComponentOperation && cOp.pathTransition.v2)
            return cOp.pathTransition.v2.join(' -> ');
        return;
    }
);