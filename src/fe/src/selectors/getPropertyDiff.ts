import { ComponentPropertyValue } from "change-cd-iac-models/infra-model"
import { InsertPropertyComponentOperation, PropertyComponentOperation, MovePropertyComponentOperation, RemovePropertyComponentOperation, Transition, UpdatePropertyComponentOperation, TransitionVersions } from "change-cd-iac-models/model-diffing"
import { groupArrayBy } from "change-cd-iac-models/utils"
import { DiffHighlightType, DiffStringifier, DiffStringOutput } from "./diff-stringifier";

export function getPropertyDiff(
    t: TransitionVersions<ComponentPropertyValue>,
    ops: PropertyComponentOperation[]
): DiffStringOutput<PropertyComponentOperation> {
    ops = ops.flatMap(o => (o instanceof UpdatePropertyComponentOperation) ? o.getLeaves() : [o]);
    const propertyToOperationMap = groupArrayBy(ops, (o: PropertyComponentOperation) => o.propertyTransition.v2);
    
    return new DiffStringifier<PropertyComponentOperation>(
        t.v2 ?? t.v1,
        ops.filter(o => o instanceof RemovePropertyComponentOperation && o.pathTransition.v1)
            .map(o => ({path: o.pathTransition.v1!, structure: {content: o.propertyTransition.v1, highlights: {[DiffHighlightType.Remove]: [o]}}})),
        propertyChangeResolverCreator(propertyToOperationMap),
    ).build();
}


const propertyChangeResolverCreator = (propertyToOperationMap: Map<ComponentPropertyValue | undefined, PropertyComponentOperation[]>) => (obj: any) => {

    const op = (propertyToOperationMap.get(obj) ?? []).filter(op => op.cause === undefined)[0];
    const indirectUpdates = (propertyToOperationMap.get(obj) || []).filter(op => op instanceof UpdatePropertyComponentOperation && op.cause !== undefined);
    const highlights = indirectUpdates.length ? {[DiffHighlightType.Update]: indirectUpdates} : {};

    if(op instanceof UpdatePropertyComponentOperation){
        if(op.propertyTransition.v1 && op.propertyTransition.v2 && op.propertyTransition.v1 !== op.propertyTransition.v2){
            return {structures: [
                {content: op.propertyTransition.v1, highlights: {[DiffHighlightType.Remove]: [op]}},
                {content: obj, highlights: {...highlights, [DiffHighlightType.Insert]: [op]}}
            ]};
        } else if (op instanceof MovePropertyComponentOperation) {
            if(!op.pathTransition.v1) throw Error("Move operation does not have previous path");
            return {
                renamedFrom: op.pathTransition.v1.slice(-1)[0],
                structures: [{content: op.propertyTransition.v2, highlights: {[DiffHighlightType.Update]: [...highlights[DiffHighlightType.Update] ?? [], op]}}]};
        }
    }

    if(op instanceof InsertPropertyComponentOperation){
        return {structures: [{content: obj, highlights: {...highlights, [DiffHighlightType.Insert]: [op]}}]};
    }
    return {structures: [{content: obj, highlights}]};
}