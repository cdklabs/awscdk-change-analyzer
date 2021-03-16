import { InfraModel } from "change-cd-iac-models/infra-model";
import { ChangeAnalysisReport } from "change-cd-iac-models/change-analysis-report";
import { extractComponentOperationsIGs } from "../isomorphic-changes";
import { DiffCreator, propagateChanges } from "../model-diffing";
import { Transition } from "change-cd-iac-models/model-diffing";

export function createChangeAnalysisReport(infraModelTransition: Transition<InfraModel>): ChangeAnalysisReport{
    const basicDiff = new DiffCreator(infraModelTransition).create();
    const propagatedDiff = propagateChanges(basicDiff);
    const isomorphicGroups = extractComponentOperationsIGs(propagatedDiff);

    return new ChangeAnalysisReport(
        propagatedDiff,
        isomorphicGroups
    );
}