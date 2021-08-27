import { RuleEffect } from '@aws-c2a/models';
import { Scalar } from './rule';

/**
 * Accepted rules from the user. Parser transforms CRules into Rules
 */
export type CFilters = Record<string, Scalar>;

type ExcludeString<E extends string[]> = Exclude<string, E>;

export type BaseSelector = {
  where?: CRuleConditions;
}

type BaseComponentSelector = {
  name?: string;
}

export type ComponentCFilter = BaseComponentSelector & (
  {
    type: string,
    subtype?: string,
  } | Record<ExcludeString<['where', 'name']>, string>
);

export function isComponentCFilter(f: Record<string, any>): f is ComponentCFilter {
  return Object.values(f).every(v => typeof v === 'string');
}

export type PathCSelector = {
  fromPath: string;
};

export function isPathCSelector(s: CSelector): s is PathCSelector {
  return {}.hasOwnProperty.call(s, 'fromPath');
}

export type GeneralCSelector = Record<ExcludeString<['where']>, CFilters>;

export type CRuleCondition = string;

export type CRuleConditions = CRuleCondition | CRuleCondition[];

export type CSelector = string | (
  BaseSelector & (ComponentCFilter | GeneralCSelector | PathCSelector)
);

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