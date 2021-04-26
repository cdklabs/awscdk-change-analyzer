import { InfraModel } from "change-cd-iac-models/infra-model";
import { ChangeAnalysisReport } from "change-cd-iac-models/change-analysis-report";
import { extractComponentOperationsAggs, extractComponentOperationsAggsPerComponent } from "../aggregations";
import { DiffCreator, propagateChanges } from "../model-diffing";
import { Transition } from "change-cd-iac-models/model-diffing";

export function createChangeAnalysisReport(infraModelTransition: Transition<InfraModel>): ChangeAnalysisReport{
    const basicDiff = new DiffCreator(infraModelTransition).create();
    const propagatedDiff = propagateChanges(basicDiff);
    const aggregations = extractComponentOperationsAggs(propagatedDiff);
    const aggregationsPerComponent = extractComponentOperationsAggsPerComponent(propagatedDiff);

    return new ChangeAnalysisReport(
        propagatedDiff,
        aggregations,
        aggregationsPerComponent
    );
}