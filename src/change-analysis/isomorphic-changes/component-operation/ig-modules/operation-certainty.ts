import { ComponentOperation } from "../../../model-diffing";
import { EqualityIGModule } from "../../ig-module";

export const operationCertaintyIGModule = new EqualityIGModule(
    'Operation Certainty',
    (cOp: ComponentOperation) => {
        return cOp.certainty;
    }
);