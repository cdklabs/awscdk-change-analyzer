import { ComponentOperation, InfraModelDiff, UpdatePropertyComponentOperation } from "change-cd-iac-models/model-diffing";
import { ModuleTreeIGsExtractor } from "../igs-extractor";
import { IsomorphicGroup } from "change-cd-iac-models/isomorphic-groups";
import { ComponentOperationIGModuleTree } from "./moduleTree";
import { addIGDescriptions } from "../ig-add-descriptions";
import * as descriptionCreators from "./description-creators";

export const extractComponentOperationsIGs = (diff: InfraModelDiff): IsomorphicGroup<ComponentOperation>[] => {

    const explodedOperation = explodeOperations(diff.componentOperations);
    return addIGDescriptions(
        ModuleTreeIGsExtractor.extract(ComponentOperationIGModuleTree, explodedOperation),
        Object.values(descriptionCreators)
    );
};

const explodeOperations = (ops: ComponentOperation[]) => {
    return ops.flatMap(o => (o instanceof UpdatePropertyComponentOperation) ? o.getLeaves() : [o]);
};