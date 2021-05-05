import { CompOpAggCharacteristics } from "change-cd-iac-models/aggregations";
import { ComponentOperation } from "change-cd-iac-models/model-diffing";
import { EqualityAggModule } from "../../aggregation-module";
import { RuleEffect, RuleRisk } from "change-cd-iac-models/rules";

export const riskAggModuleCreator = (rules: Map<ComponentOperation, RuleEffect>) => new EqualityAggModule(
    CompOpAggCharacteristics.RISK,
    (cOp: ComponentOperation): RuleRisk => {
        const effect = rules.get(cOp);
        return effect?.risk ?? RuleRisk.Unknown;
    }
);