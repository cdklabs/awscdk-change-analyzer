import { ComponentOperation, InfraModelDiff } from "../../model-diffing";
import { ModuleTreeIGsExtractor } from "../igs-extractor";
import { IsomorphicGroup } from "../isomorphic-group";
import { ComponentOperationIGModuleTree } from "./moduleTree";

export const extractComponentOperationsIGs = (diff: InfraModelDiff): IsomorphicGroup<ComponentOperation>[] => {
    return ModuleTreeIGsExtractor.extract(ComponentOperationIGModuleTree, diff.componentOperations);
};