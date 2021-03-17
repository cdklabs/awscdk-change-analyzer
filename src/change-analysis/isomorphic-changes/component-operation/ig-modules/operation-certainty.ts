import { CompOpIGCharacteristics } from "change-cd-iac-models/isomorphic-groups";
import { ComponentOperation } from "change-cd-iac-models/model-diffing";
import { EqualityIGModule } from "../../ig-module";

export const operationCertaintyIGModule = new EqualityIGModule(
    CompOpIGCharacteristics.OPERATION_CERTAINTY,
    (cOp: ComponentOperation) => {
        return cOp.certainty;
    }
);