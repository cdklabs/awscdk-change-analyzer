import { CompOpAggCharacteristics } from "change-cd-iac-models/aggregations";
import { ComponentOperation } from "change-cd-iac-models/model-diffing";
import { EqualityAggModule } from "../../aggregation-module";

export const componentSubtypeAggModule = new EqualityAggModule(
    CompOpAggCharacteristics.COMPONENT_SUBTYPE,
    (cOp: ComponentOperation) => {
        return cOp.componentTransition.v2?.subtype
            ?? cOp.componentTransition.v1?.subtype
            ?? undefined;
    }
);