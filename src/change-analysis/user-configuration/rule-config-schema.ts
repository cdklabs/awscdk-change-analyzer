import { RuleEffectDefinition, Scalar } from "./rule";


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

export type ComponentCSelector = {
    component: ComponentCFilter;
};

export function isComponentCSelector(s: CSelector): s is ComponentCSelector {
    return {}.hasOwnProperty.call(s, 'component');
}

export type GeneralCSelector = {
    [type: string]: CFilters,
}

export type CRuleConditions = string | string[];

export type CSelector = (
    BaseSelector & (
        ComponentCFilter |
        GeneralCSelector |
        PathCSelector | 
        ComponentCSelector
    )
) | string;

export type CBindings = {[identifier: string]: CSelector};

export interface CUserRule {
    let?: CBindings;
    where?: CRuleConditions;
    then?: CUserRule[];
    effect?: RuleEffectDefinition;
}

export type CUserRules = CUserRule[];