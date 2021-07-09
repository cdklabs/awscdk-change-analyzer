import { InfraModel, StructuralRelationship } from "change-analysis-models";
import { ChangeAnalysisReport } from "change-analysis-models";
import { extractComponentOperationsAggs, extractComponentOperationsAggsPerComponent } from "../aggregations";
import { DiffCreator, propagateChanges } from "../model-diffing";
import { Transition } from "change-analysis-models";
import { CUserRules } from "../user-configuration";
import { applyRules } from "../user-configuration/apply-rules";

export function createChangeAnalysisReport(infraModelTransition: Transition<InfraModel>, rules: CUserRules): ChangeAnalysisReport{
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