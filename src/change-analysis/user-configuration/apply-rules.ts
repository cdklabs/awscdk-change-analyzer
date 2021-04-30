import { ComponentOperation, InfraModelDiff, PropertyComponentOperation } from "change-cd-iac-models/model-diffing";
import { RuleEffect } from "change-cd-iac-models/rules";
import { isDefined } from "fifinet/util";
import { CUserRules } from "./rule-config-schema";
import { parseRules } from "./rule-parser";
import { RuleProcessor } from "./rule-processor";

export function applyRules(diff: InfraModelDiff, cRules: CUserRules): Map<ComponentOperation, RuleEffect> {

    const rules = parseRules(cRules);
    const idToOpMap = new Map(diff.componentOperations
        .flatMap(op => op instanceof PropertyComponentOperation ? op.explode() : [op]).map(op => [op.nodeData._id, op]));

    const verticesMap = new RuleProcessor(diff.generateOutgoingGraph()).processRules(rules);

    return new Map([...verticesMap].map(([vertex, effect]): [ComponentOperation, RuleEffect] | undefined => {
        const op = idToOpMap.get(vertex._id);
        if(op === undefined) return undefined;
        return [op, effect];
    }).filter(isDefined));
}