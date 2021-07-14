import { RuleEffect, ComponentOperation, CompOpAggCharacteristics } from 'cdk-change-analyzer-models';
import { AggModuleTreeNode } from '../aggregation-module-tree-node';
import {
  componentTypeAggModule,
  componentSubtypeAggModule,
  operationTypeAggModule,
  operationEntityAggModule,
  operationCauseAggModule,
} from './aggregation-modules';
import { entityOperationTypeAggModule } from './aggregation-modules/entity-operation-type';
import { riskAggModuleCreator } from './aggregation-modules/operation-risk';
import { propertyPathV1AggModule, propertyPathV2AggModule } from './aggregation-modules/property-path';
import { propertyValueV1AggModule, propertyValueV2AggModule } from './aggregation-modules/property-value';

const propertyValueSubModules = [
  {
    module: propertyValueV1AggModule,
    disableOnNoExtraInfo: true,
  },
  {
    module: propertyValueV2AggModule,
    disableOnNoExtraInfo: true,
  },
];

/**
 * Defines the modules used to build the aggregations for operations of a component
 */
export const componentOperationSpecificAggModuleTree: AggModuleTreeNode<ComponentOperation> = {
  module: operationTypeAggModule,
  forceSubmoduleCollapse: true,
  submodules: [{
    module: operationEntityAggModule,
    forceSubmoduleCollapse: true,
    submodules: [{
      module: entityOperationTypeAggModule,
      submodules: [
        { module: operationCauseAggModule, disableOnNoExtraInfo: true },
        {
          module: propertyPathV1AggModule,
          submodules: propertyValueSubModules,
          requiredCharacteristics: { [CompOpAggCharacteristics.AFFECTED_ENTITY]: 'Property' },
        },
        {
          module: propertyPathV2AggModule,
          submodules: propertyValueSubModules,
          requiredCharacteristics: { [CompOpAggCharacteristics.AFFECTED_ENTITY]: 'Property' },
        },
      ],
    }],
  }],
};

/**
 * Defines the modules used to build the aggregations for all operations
 */
export const componentOperationAggModuleTree: AggModuleTreeNode<ComponentOperation> = {
  module: componentTypeAggModule,
  forceSubmoduleCollapse: true,
  submodules: [{
    module: componentSubtypeAggModule,
    disableSubmoduleCollapse: true,
    submodules: [componentOperationSpecificAggModuleTree],
  }],
};

/**
 * Defines the modules used to build the aggregations for all operations,
 * including risk calculated from rule effects
 */
export function compOperationWithRulesAggModuleTree (
  rules: Map<ComponentOperation, RuleEffect>,
): AggModuleTreeNode<ComponentOperation>{
  return {
    module: riskAggModuleCreator(rules),
    disableSubmoduleCollapse: true,
    submodules: [componentOperationAggModuleTree],
  };
}