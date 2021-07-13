import { CompOpAggCharacteristics } from "cdk-change-analyzer-models";
import { ComponentOperation } from "cdk-change-analyzer-models";
import { EqualityAggModule } from "../../aggregation-module";

export const componentSubtypeAggModule = new EqualityAggModule(
    CompOpAggCharacteristics.COMPONENT_SUBTYPE,
    (cOp: ComponentOperation) => {
        return cOp.componentTransition.v2?.subtype
            ?? cOp.componentTransition.v1?.subtype
            ?? undefined;
    }
);