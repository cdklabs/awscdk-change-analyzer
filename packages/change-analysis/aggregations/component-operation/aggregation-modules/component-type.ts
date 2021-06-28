import { CompOpAggCharacteristics } from "change-analysis-models";
import { ComponentOperation } from "change-analysis-models";
import { EqualityAggModule } from "../../aggregation-module";

export const componentTypeAggModule = new EqualityAggModule(
    CompOpAggCharacteristics.COMPONENT_TYPE,
    (cOp: ComponentOperation) => {
        const type = cOp.componentTransition.v2?.type
            ?? cOp.componentTransition.v1?.type;
        if(type === undefined){
            throw Error("Component Operation's component transition has neither a first nor a second component version");
        }
        return type;
    }
);