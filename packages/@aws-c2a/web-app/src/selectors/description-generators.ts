import {
  ChangeAnalysisReport,
  Component,
  ComponentOperation,
  InsertComponentOperation,
  RemoveComponentOperation,
  RenameComponentOperation,
  Transition,
} from '@aws-c2a/models';

export function getComponentOperationsDescription(
  compTransition: Transition<Component>,
  changeReport: ChangeAnalysisReport,
): string {
  const ops = changeReport.infraModelDiff.getTransitionOperations(compTransition);

  if(!ops.length) return 'Unchanged';

  return [...new Set(ops.map(getComponentOperationDescription))].join(', ');
}

export function getComponentOperationDescription(o: ComponentOperation): string {
  if(o instanceof InsertComponentOperation)
    return 'Inserted';
  if(o instanceof RemoveComponentOperation)
    return 'Removed';
  else if (o instanceof RenameComponentOperation)
    return `Renamed (was ${o.componentTransition.v1?.name ?? '[NAME NOT FOUND]'})`;
  else return 'Updated';
}