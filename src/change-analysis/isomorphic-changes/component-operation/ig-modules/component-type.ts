import { CompOpIGCharacteristics } from "change-cd-iac-models/isomorphic-groups";
import { ComponentOperation } from "change-cd-iac-models/model-diffing";
import { EqualityIGModule } from "../../ig-module";

export const componentTypeIGModule = new EqualityIGModule(
    CompOpIGCharacteristics.COMPONENT_TYPE,
    (cOp: ComponentOperation) => {
        const type = cOp.componentTransition.v2?.type
            ?? cOp.componentTransition.v1?.type;
        if(type === undefined){
            throw Error("Component Operation's component transition has neither a first nor a second component version");
        }
        return type;
    }
);