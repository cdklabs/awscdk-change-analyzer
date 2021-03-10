import { ComponentOperation } from "../../../model-diffing";
import { EqualityIGModule } from "../../ig-module";

export const componentSubtypeIGModule = new EqualityIGModule(
    'Component Subtype',
    (cOp: ComponentOperation) => {
        return cOp.componentTransition.v2?.subtype
            ?? cOp.componentTransition.v1?.subtype
            ?? 'Unknown component subtype';
    }
);