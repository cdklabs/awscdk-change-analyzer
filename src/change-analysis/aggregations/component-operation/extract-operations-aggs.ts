import { ComponentOperation, InfraModelDiff, UpdatePropertyComponentOperation } from "change-cd-iac-models/model-diffing";
import { ModuleTreeAggsExtractor } from "../aggregations-extractor";
import { Aggregation } from "change-cd-iac-models/aggregations";
import { ComponentOperationAggModuleTree } from "./moduleTree";
import { addAggDescriptions } from "../add-aggregation-descriptions";
import * as descriptionCreators from "./description-creators";

export const extractComponentOperationsAggs = (diff: InfraModelDiff): Aggregation<ComponentOperation>[] => {

    const explodedOperation = explodeOperations(diff.componentOperations);
    return addAggDescriptions(
        ModuleTreeAggsExtractor.extract(ComponentOperationAggModuleTree, explodedOperation),
        Object.values(descriptionCreators)
    );
};

const explodeOperations = (ops: ComponentOperation[]) => {
    return ops.flatMap(o => (o instanceof UpdatePropertyComponentOperation) ? o.getLeaves() : [o]);
};