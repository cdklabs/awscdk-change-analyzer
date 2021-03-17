import { CompOpIGCharacteristics } from "change-cd-iac-models/isomorphic-groups";
import { ComponentOperation } from "change-cd-iac-models/model-diffing";
import { EqualityIGModule } from "../../ig-module";

export const componentSubtypeIGModule = new EqualityIGModule(
    CompOpIGCharacteristics.COMPONENT_SUBTYPE,
    (cOp: ComponentOperation) => {
        return cOp.componentTransition.v2?.subtype
            ?? cOp.componentTransition.v1?.subtype
            ?? undefined;
    }
);