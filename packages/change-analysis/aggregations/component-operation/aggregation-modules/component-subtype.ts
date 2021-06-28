import { CompOpAggCharacteristics } from "change-analysis-models";
import { ComponentOperation } from "change-analysis-models";
import { EqualityAggModule } from "../../aggregation-module";

export const componentSubtypeAggModule = new EqualityAggModule(
    CompOpAggCharacteristics.COMPONENT_SUBTYPE,
    (cOp: ComponentOperation) => {
        return cOp.componentTransition.v2?.subtype
            ?? cOp.componentTransition.v1?.subtype
            ?? undefined;
    }
);