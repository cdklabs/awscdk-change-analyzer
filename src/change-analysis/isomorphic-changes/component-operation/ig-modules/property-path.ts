import { CompOpIGCharacteristics } from "change-cd-iac-models/isomorphic-groups";
import {
    ComponentOperation,
    PropertyComponentOperation,
} from "change-cd-iac-models/model-diffing";
import { EqualityIGModule } from "../../ig-module";

export const propertyPathV1IGModule = new EqualityIGModule(
    CompOpIGCharacteristics.PROPERTY_PATH_BEFORE,
    (cOp: ComponentOperation) => {
        if(cOp instanceof PropertyComponentOperation && cOp.pathTransition.v1)
            return JSON.stringify(cOp.pathTransition.v1);
        return;
    }
);

export const propertyPathV2IGModule = new EqualityIGModule(
    CompOpIGCharacteristics.PROPERTY_PATH_AFTER,
    (cOp: ComponentOperation) => {
        if(cOp instanceof PropertyComponentOperation && cOp.pathTransition.v2)
            return JSON.stringify(cOp.pathTransition.v2);
        return;
    }
);