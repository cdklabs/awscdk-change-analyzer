import { ComponentOperation } from "../../../model-diffing";
import { EqualityIGModule } from "../../ig-module";

export const componentTypeIGModule = new EqualityIGModule(
    'Component Type',
    (cOp: ComponentOperation) => {
        const type = cOp.componentTransition.v2?.type
            ?? cOp.componentTransition.v1?.type;
        if(type === undefined){
            throw Error("Component Operation's component transition has neither a first nor a second component version");
        }
        return type;
    }
);