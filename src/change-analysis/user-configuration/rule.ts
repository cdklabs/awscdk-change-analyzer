
export enum RuleConditionOperator {
    references = '->', // for following dependency relationships
    isReferencedIn = '<-',
    contains = '>>', // for following structural relationships
    isContainedIn = '<<',
    appliesTo = 'appliesTo', // for checking a change against an InfraModel entity
    affects = 'affects', // for checking a change against any directly or indirectly affected InfraModel entity
    equals = '==',
    notEquals = '!=',
    greaterThan = '>',
    greaterOrEqual = '>=',
    lessThan = '<',
    lessOrEqual = '<=',
}

export type ConditionInput = {
    scalar?: number | string | boolean;
    identifier?: string;
    propertyPath?: string[];
}

export type RuleCondition = {
    operator: RuleConditionOperator;
    leftInput: ConditionInput;
    rightInput: ConditionInput;
}

export type RuleConditions = RuleCondition[];

export type Selector = {
    filter?: Record<string, any>;
    where?: RuleConditions;
}

export type Bindings = {[identifier: string]: Selector};

export enum RuleRisk {
    Low = 'low',
    High = 'high',
    Unknown = 'unknown',
}

export enum RuleAction {
    Approve = 'approve',
    Reject = 'reject',
    None = 'none',
}

export interface Scope {
    let?: Bindings;
    where?: RuleConditions;
    then?: Scope[];
    classifications?: { risk: RuleRisk; action?: RuleAction } | { risk?: RuleRisk; action: RuleAction };
}