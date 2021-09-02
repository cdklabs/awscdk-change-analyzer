import { InfraModel, ChangeAnalysisReport, Transition } from '@aws-c2a/models';
import { CUserRules } from '@aws-c2a/rules';
import { extractComponentOperationsAggs, extractComponentOperationsAggsPerComponent } from '../aggregations';
import { DiffCreator, propagateChanges } from '../model-diffing';
import { applyRules } from '../rules/apply-rules';

export function createChangeAnalysisReport(
  infraModelTransition: Transition<InfraModel>,
  rules: CUserRules,
): ChangeAnalysisReport{
  const basicDiff = new DiffCreator(infraModelTransition).create();
  const propagatedDiff = propagateChanges(basicDiff);
  const ruleOutputs = applyRules(propagatedDiff, rules);
  const aggregations = extractComponentOperationsAggs(propagatedDiff, ruleOutputs);
  const aggregationsPerComponent = extractComponentOperationsAggsPerComponent(propagatedDiff);

  return new ChangeAnalysisReport(
    propagatedDiff,
    aggregations,
    aggregationsPerComponent,
    ruleOutputs,
  );
}