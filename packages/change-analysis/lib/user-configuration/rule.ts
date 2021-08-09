import { RuleEffect } from 'cdk-change-analyzer-models';

/**
 * Internal representation of the user defined rules (after parsing)
 */
export enum RuleConditionOperator {
  // references = '->', // for following dependency relationships
  // isReferencedIn = '<-',
  // contains = '>>', // for following structural relationships
  // isContainedIn = '<<',
  appliesTo = 'appliesTo', // for checking a change against an InfraModel entity
  // affects = 'affects', // for checking a change against any directly or indirectly affected InfraModel entity
  equals = '==',
  // notEquals = '!=',
  // greaterThan = '>',
  // greaterOrEqual = '>=',
  // lessThan = '<',
  // lessOrEqual = '<=',
}
export type Scalar = number | string | boolean;

export type ConditionInput = {
  scalar: Scalar;
} | RuleScopeReference;

export function isInputScalar(i: ConditionInput): i is {scalar: Scalar} {
  return {}.hasOwnProperty.call(i, 'scalar');
}

export type RuleCondition = {
  operator: RuleConditionOperator;
  leftInput: ConditionInput;
  rightInput: ConditionInput;
}

export type RuleConditions = RuleCondition[];

export type RuleScopeReference = {
  identifier: string,
  propertyPath?: string[]
}

export type SelectorFilter = {
  [key: string]: Scalar,
} & {
  entityType: string,
}

export type Selector = ({
  filter?: SelectorFilter;
} | {
  propertyReference: RuleScopeReference;
}) & {
  where?: RuleConditions;
}

export function selectorIsReference(
  s: Selector,
): s is {propertyReference: RuleScopeReference} & {where?: RuleConditions} {
  return {}.hasOwnProperty.call(s, 'identifier');
}

export type Bindings = {[identifier: string]: Selector};

export interface UserRule {
  let?: Bindings;
  where?: RuleConditions; // TODO argument should be CRuleConditions
  then?: UserRule[];
  effect?: RuleEffectDefinition;
}

export type UserRules = UserRule[];

export type RuleEffectDefinition = {
  target: string,
} & RuleEffect;