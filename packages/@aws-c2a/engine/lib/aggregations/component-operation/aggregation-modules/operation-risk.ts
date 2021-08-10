import { ComponentOperation, CompOpAggCharacteristics, RuleEffect, RuleRisk } from '@aws-c2a/models';
import { EqualityAggModule } from '../../aggregation-module';

export const riskAggModuleCreator = (rules: Map<ComponentOperation, RuleEffect>) => new EqualityAggModule(
  CompOpAggCharacteristics.RISK,
  (cOp: ComponentOperation): RuleRisk => {
    const effect = rules.get(cOp);
    return effect?.risk ?? RuleRisk.Unknown;
  },
);