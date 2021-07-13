import { RuleEffect } from "cdk-change-analyzer-models";
import { Scalar } from "./rule";


export type CFilters = Record<string, Scalar>;

export interface BaseSelector {
    where?: CRuleConditions
}

export type ComponentCFilter = ({
    type: string,
    subtype?: string,
} | Record<string, string> //shortform for specifying type and subtype
) & {
    name?: string,
};

export function isComponentCFilter(f: Record<string, any>): f is ComponentCFilter {
    return Object.values(f).every(v => typeof v === 'string');
}

export type PathCSelector = {
    fromPath: string;
};

export function isPathCSelector(s: CSelector): s is PathCSelector {
    return {}.hasOwnProperty.call(s, 'fromPath');
}

export type GeneralCSelector = {
    [type: string]: CFilters,
}

export type CRuleConditions = string | string[];

export type CSelector = (
    BaseSelector & (
        ComponentCFilter |
        GeneralCSelector |
        PathCSelector
    )
) | string;

export type CBindings = {[identifier: string]: CSelector};

export type CRuleEffectDefinition = {
    target?: string,
} & RuleEffect;

export interface CUserRule {
    let?: CBindings;
    where?: CRuleConditions;
    then?: CUserRule[];
    effect?: CRuleEffectDefinition;
}

export type CUserRules = CUserRule[];