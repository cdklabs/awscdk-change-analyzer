import { CompOpAggCharacteristics } from "cdk-change-analyzer-models";
import { ComponentOperation } from "cdk-change-analyzer-models";
import { EqualityAggModule } from "../../aggregation-module";
import { RuleEffect, RuleRisk } from "cdk-change-analyzer-models";

export const riskAggModuleCreator = (rules: Map<ComponentOperation, RuleEffect>) => new EqualityAggModule(
    CompOpAggCharacteristics.RISK,
    (cOp: ComponentOperation): RuleRisk => {
        const effect = rules.get(cOp);
        return effect?.risk ?? RuleRisk.Unknown;
    }
);