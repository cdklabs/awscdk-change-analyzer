import { ComponentOperation, InfraModelDiff, Transition, UpdatePropertyComponentOperation } from "change-cd-iac-models/model-diffing";
import { ModuleTreeAggsExtractor } from "../aggregations-extractor";
import { Aggregation } from "change-cd-iac-models/aggregations";
import { componentOperationAggModuleTree, componentOperationSpecificAggModuleTree } from "./moduleTree";
import { addAggDescriptions } from "../add-aggregation-descriptions";
import * as descriptionCreators from "./description-creators";
import { groupArrayBy } from "change-cd-iac-models/utils";
import { Component } from "change-cd-iac-models/infra-model";

export const extractComponentOperationsAggs = (diff: InfraModelDiff): Aggregation<ComponentOperation>[] => {

    const explodedOperation = explodeOperations(diff.componentOperations);
    return addAggDescriptions(
        ModuleTreeAggsExtractor.extract(componentOperationAggModuleTree, explodedOperation),
        Object.values(descriptionCreators)
    );
};

export const extractComponentOperationsAggsPerComponent = (diff: InfraModelDiff): Map<Transition<Component>, Aggregation<ComponentOperation>[]> => {
    
    const opsPerComponent = groupArrayBy(diff.componentOperations, (op) => op.componentTransition);

    return new Map(diff.componentTransitions.map(t => {
        const componentOps = opsPerComponent.get(t);
        if(!componentOps) return [t, []];

        const explodedOperation = explodeOperations(componentOps);
        return [t, addAggDescriptions(
            ModuleTreeAggsExtractor.extract(componentOperationSpecificAggModuleTree, explodedOperation),
            Object.values(descriptionCreators)
        )];
    }));
};

const explodeOperations = (ops: ComponentOperation[]) => {
    return ops.flatMap(o => (o instanceof UpdatePropertyComponentOperation) ? o.getLeaves() : [o]);
};