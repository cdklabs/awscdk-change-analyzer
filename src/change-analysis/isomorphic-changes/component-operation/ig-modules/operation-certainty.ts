import { ComponentOperation } from "change-cd-iac-models/model-diffing";
import { EqualityIGModule } from "../../ig-module";

export const operationCertaintyIGModule = new EqualityIGModule(
    'Operation Certainty',
    (cOp: ComponentOperation) => {
        return cOp.certainty;
    }
);