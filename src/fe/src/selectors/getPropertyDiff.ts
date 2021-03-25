import { ComponentProperty } from "change-cd-iac-models/infra-model"
import { InsertPropertyComponentOperation, PropertyComponentOperation, MovePropertyComponentOperation, RemovePropertyComponentOperation, Transition, UpdatePropertyComponentOperation } from "change-cd-iac-models/model-diffing"
import { groupArrayBy } from "change-cd-iac-models/utils"
import { DiffHighlightType, DiffStringifier, DiffStringOutput } from "./diff-stringifier";

export function getPropertyDiff(
    t: Transition<ComponentProperty>,
    ops: PropertyComponentOperation[]
): DiffStringOutput {
    ops = ops.flatMap(o => (o instanceof UpdatePropertyComponentOperation) ? o.getLeaves() : [o]);
    const propertyToOperationMap = groupArrayBy(ops, (o: PropertyComponentOperation) => o.propertyTransition.v2 || o.propertyTransition.v1);

    return new DiffStringifier(
        t.v2 ?? t.v1,
        ops.filter(o => o instanceof RemovePropertyComponentOperation && o.pathTransition.v1)
            .map(o => ({path: o.pathTransition.v1!, structure: {content: o.propertyTransition.v1, highlights: [DiffHighlightType.Remove]}})),
        (obj: any) => {

        const op = (propertyToOperationMap.get(obj) || [])[0];
        
        if(op instanceof UpdatePropertyComponentOperation){
            if(op.propertyTransition.v1 && op.propertyTransition.v2 && op.propertyTransition.v1 !== op.propertyTransition.v2){
                return {structures: [
                    {content: op.propertyTransition.v1, highlights: [DiffHighlightType.Remove]},
                    {content: obj, highlights: [DiffHighlightType.Insert]}
                ]};
            } else if (op instanceof MovePropertyComponentOperation) {
                if(!op.pathTransition.v1) throw Error("Move operation does not have previous path");
                return {
                    renamedFrom: op.pathTransition.v1.slice(-1)[0],
                    structures: [{content: op.propertyTransition.v2, highlights: []}]};
            } else {
                return {structures: [{content: op.propertyTransition.v2, highlights: [DiffHighlightType.Update]}]};
            }
        }

        if(op instanceof InsertPropertyComponentOperation){
            return {structures: [{content: obj, highlights: [DiffHighlightType.Insert]}]};
        }
        return {structures: [{content: obj, highlights: []}]};
    }).build();
}