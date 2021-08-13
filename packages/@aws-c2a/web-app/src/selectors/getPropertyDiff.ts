import {
  groupArrayBy,
  InsertPropertyComponentOperation,
  PropertyComponentOperation,
  MovePropertyComponentOperation,
  RemovePropertyComponentOperation,
  UpdatePropertyComponentOperation,
  TransitionVersions,
  ComponentPropertyValue,
} from '@aws-c2a/models';
import { DiffHighlightType, DiffStringifier, DiffStringOutput } from './diff-stringifier';

export function getPropertyDiff(
  t: TransitionVersions<ComponentPropertyValue>,
  ops: PropertyComponentOperation[],
): DiffStringOutput<PropertyComponentOperation> {
  ops = ops.flatMap(o => (o instanceof UpdatePropertyComponentOperation) ? o.getLeaves() : [o]);
  const propertyToOperationMap = groupArrayBy(ops, (o: PropertyComponentOperation) => o.propertyTransition.v2);

  return new DiffStringifier<PropertyComponentOperation>(
    t.v2 ?? t.v1,
    ops.filter(o => o instanceof RemovePropertyComponentOperation && o.pathTransition.v1)
      .map(o => ({
        // Above filter ensure this exists
        path: o.pathTransition.v1!, // eslint-disable-line @typescript-eslint/no-non-null-assertion
        structure: {content: o.propertyTransition.v1, highlights: {[DiffHighlightType.Remove]: [o]}},
      })),
    propertyChangeResolverCreator(propertyToOperationMap),
  ).build();
}


const propertyChangeResolverCreator = (
  propertyToOperationMap: Map<ComponentPropertyValue | undefined, PropertyComponentOperation[]>,
) => (obj: any) => {
  const firstOp = (propertyToOperationMap.get(obj) ?? []).filter(op => op.cause === undefined)[0];
  const indirectUpdates = (propertyToOperationMap.get(obj) || [])
    .filter(op => op instanceof UpdatePropertyComponentOperation && op.cause !== undefined);
  const highlights = indirectUpdates.length ? {[DiffHighlightType.Update]: indirectUpdates} : {};

  if(firstOp instanceof UpdatePropertyComponentOperation){
    if(firstOp.propertyTransition.v1 && firstOp.propertyTransition.v2
        && firstOp.propertyTransition.v1 !== firstOp.propertyTransition.v2) {
      return {structures: [
        {content: firstOp.propertyTransition.v1, highlights: {[DiffHighlightType.Remove]: [firstOp]}},
        {content: obj, highlights: {...highlights, [DiffHighlightType.Insert]: [firstOp]}},
      ]};
    } else if (firstOp instanceof MovePropertyComponentOperation) {
      if(!firstOp.pathTransition.v1) throw Error('Move operation does not have previous path');
      return {
        renamedFrom: firstOp.pathTransition.v1.slice(-1)[0],
        structures: [{
          content: firstOp.propertyTransition.v2,
          highlights: {[DiffHighlightType.Update]: [...highlights[DiffHighlightType.Update] ?? [], firstOp]},
        }],
      };
    }
  }

  if(firstOp instanceof InsertPropertyComponentOperation){
    return {structures: [{content: obj, highlights: {...highlights, [DiffHighlightType.Insert]: [firstOp]}}]};
  }
  return {structures: [{content: obj, highlights}]};
};