import { CompOpAggCharacteristics } from "change-analysis-models";
import { ComponentOperation } from "change-analysis-models";
import { EqualityAggModule } from "../../aggregation-module";
import { RuleEffect, RuleRisk } from "change-analysis-models";

export const riskAggModuleCreator = (rules: Map<ComponentOperation, RuleEffect>) => new EqualityAggModule(
    CompOpAggCharacteristics.RISK,
    (cOp: ComponentOperation): RuleRisk => {
        const effect = rules.get(cOp);
        return effect?.risk ?? RuleRisk.Unknown;
    }
);