import { CompOpIGCharacteristics } from "change-cd-iac-models/isomorphic-groups";
import { ComponentOperation } from "change-cd-iac-models/model-diffing";
import { EqualityIGModule } from "../../ig-module";
import { componentSubtypeIGModule } from "./component-subtype";
import { componentTypeIGModule } from "./component-type";
import { operationEntityIGModule } from "./operation-entity";
import { operationTypeIGModule } from "./operation-type";

export const operationCauseIGModule = new EqualityIGModule(
    CompOpIGCharacteristics.OPERATION_CAUSE,
    (cOp: ComponentOperation) => {
        return cOp.cause
            ? `Operation ${operationTypeIGModule.indexValueGetter(cOp.cause)} of ${
                operationEntityIGModule.indexValueGetter(cOp.cause)
                ?? componentSubtypeIGModule.indexValueGetter(cOp.cause)
                ?? componentTypeIGModule.indexValueGetter(cOp.cause)
            }`
            : 'Direct Change';
    }
);