import { ComponentOperation } from "../../../model-diffing";
import { EqualityIGModule } from "../../ig-module";
import { operationEntityIGModule } from "./operation-entity";
import { operationTypeIGModule } from "./operation-type";

export const operationCauseIGModule = new EqualityIGModule(
    'Operation Cause',
    (cOp: ComponentOperation) => {
        return cOp.cause
            ? `Operation ${operationTypeIGModule.indexValueGetter(cOp.cause)} of ${operationEntityIGModule.indexValueGetter(cOp.cause)}`
            : 'Direct Change';
    }
);