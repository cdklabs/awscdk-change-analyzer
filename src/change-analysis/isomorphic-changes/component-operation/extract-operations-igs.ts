import { ComponentOperation, InfraModelDiff } from "change-cd-iac-models/model-diffing";
import { ModuleTreeIGsExtractor } from "../igs-extractor";
import { IsomorphicGroup } from "change-cd-iac-models/isomorphic-groups";
import { ComponentOperationIGModuleTree } from "./moduleTree";

export const extractComponentOperationsIGs = (diff: InfraModelDiff): IsomorphicGroup<ComponentOperation>[] => {
    return ModuleTreeIGsExtractor.extract(ComponentOperationIGModuleTree, diff.componentOperations);
};