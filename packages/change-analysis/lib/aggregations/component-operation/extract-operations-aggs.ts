import {
  ComponentOperation,
  InfraModelDiff,
  Transition,
  UpdatePropertyComponentOperation,
  Aggregation,
  groupArrayBy,
  Component,
  RuleEffect,
} from 'cdk-change-analyzer-models';
import { flatMap } from '../../private/node';
import { addAggDescriptions } from '../add-aggregation-descriptions';
import { ModuleTreeAggsExtractor } from '../aggregations-extractor';
import * as descriptionCreators from './description-creators';
import { componentOperationSpecificAggModuleTree, compOperationWithRulesAggModuleTree } from './moduleTree';

export function extractComponentOperationsAggs(
  diff: InfraModelDiff,
  rules: Map<ComponentOperation, RuleEffect>,
): Aggregation<ComponentOperation>[] {

  const explodedOperation = explodeOperations(diff.componentOperations);
  return addAggDescriptions(
    ModuleTreeAggsExtractor.extract(compOperationWithRulesAggModuleTree(rules), explodedOperation),
    Object.values(descriptionCreators),
  );
}

export function extractComponentOperationsAggsPerComponent(
  diff: InfraModelDiff,
): Map<Transition<Component>, Aggregation<ComponentOperation>[]>{

  const opsPerComponent = groupArrayBy(diff.componentOperations, (op) => op.componentTransition);

  return new Map(diff.componentTransitions.map(t => {
    const componentOps = opsPerComponent.get(t);
    if(!componentOps) return [t, []];

    const explodedOperation = explodeOperations(componentOps);
    return [t, addAggDescriptions(
      ModuleTreeAggsExtractor.extract(componentOperationSpecificAggModuleTree, explodedOperation),
      Object.values(descriptionCreators),
    )];
  }));
}

const explodeOperations = (ops: ComponentOperation[]) => {
  return flatMap(ops, o => (o instanceof UpdatePropertyComponentOperation) ? o.getLeaves() : [o]);
};