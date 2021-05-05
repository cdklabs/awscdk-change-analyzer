import { isDefined } from "change-cd-iac-models/utils";
import { ModelEntityTypes } from "change-cd-iac-models/infra-model";
import { ConditionInput, RuleCondition, RuleConditionOperator, RuleConditions, Selector, SelectorFilter, UserRule, RuleScopeReference } from "./rule";
import { CBindings, CSelector, CUserRule, isComponentCSelector, isPathCSelector, ComponentCFilter, CRuleConditions, isComponentCFilter, GeneralCSelector } from "./rule-config-schema";


export function parseRules(rules: CUserRule[]): UserRule[]{
    return rules.map(r => parseRule(r));
}

function parseRule(rule: CUserRule): UserRule {
    return {
        let: parseBindings(rule.let),
        ...parseConditions(rule.where),
        ...rule.then ? {then: parseRules(rule.then)} : {},
        effect: rule.effect
    };
}

function parseBindings(bindings?: CBindings){
    if(!bindings) return {};
    return Object.fromEntries(
        Object.entries(bindings).map(([identifier, cselector]) =>
            [identifier, parseSelector(cselector)])
    );
}

function parseSelector(selector: CSelector): Selector {
    if(typeof selector === 'string')
        return parseStringSelector(selector);
    
    if(typeof selector !== 'object' || selector === null)
        throw Error("Selector format not supported");
    
    if(isPathCSelector(selector)){
        if(typeof selector.fromPath !== 'string')
            throw Error("'fromPath' selector must be a string");
        return {
            ...parseStringSelector(selector.fromPath),
            ...parseConditions(selector.where)
        };
    }

    if(isComponentCSelector(selector)){
        if(typeof selector.component !== 'object' || selector.component === null)
            throw Error("'component' selector must be an object");
        return {
            filter: parseComponentCFilter(selector.component),
            ...parseConditions(selector.where)
        };
    }

    if(isComponentCFilter(selector)){
        const { where, ...filter } = selector;
        return {
            filter: parseComponentCFilter(filter),
            ...parseConditions(where)
        };
    }

    const { where, ...filter } = selector;
    return {
        filter: parseGeneralFilter(filter),
        ...parseConditions(where)
    };
}

function parseGeneralFilter(selector: GeneralCSelector): SelectorFilter {
    const keys = Object.keys(selector);
    if(keys.length !== 1)
        throw Error("Selector must have at least one property (other than where)");

    return {
        ...selector[keys[0]],
        _entityType: keys[0],
    };
}

function parseComponentCFilter(selector: ComponentCFilter): SelectorFilter {
    const { name, ...shortform} = selector;
    let { type, subtype } = selector;

    const shortformKeys = Object.keys(shortform);
    if(shortformKeys.length + ((isDefined(type) || isDefined(subtype)) ? 1 : 0) > 1)
        throw Error("Cannot specify type or subtype more than once");

    if(shortformKeys.length){
        type = shortformKeys[0];
        const tmpSubtype = (shortform as {[type: string]: string})[type];
        if(typeof tmpSubtype !== 'string')
            throw Error("Shortform of component selector must have a string subtype");
        subtype = tmpSubtype;
    }

    return {
            _entityType: ModelEntityTypes.component,
            type,
            ...subtype ? {subtype} : {},
            ...name ? {name} : {},
    };
}

function parseStringSelector(selector: string): Selector {
    return {
        propertyReference: parseScopeReference(selector)
    };
}

function parseScopeReference(s: string): RuleScopeReference {
    const [ identifier , ...propertyPath] = s.split('.');
    return {
        identifier,
        propertyPath
    };
}


function parseConditions(
    conditions?: CRuleConditions
): { where?: RuleConditions; } {
    if(conditions === undefined) return {};

    return {
        where: (typeof conditions === 'string'
                ? [parseCondition(conditions)]
                : conditions.map(parseCondition)
            ).filter(isDefined)
    };
}

function parseCondition(condition: string): RuleCondition | undefined {
    const splitConditions = condition
        .split(/\s+/g);
    if(!splitConditions || splitConditions.length !== 3)
        return;
    const [leftInput, operator, rightInput] = splitConditions;

    if(!Object.values(RuleConditionOperator).includes(operator as RuleConditionOperator))
        return;

    const conditionInputFromStr = (s: string): ConditionInput => {
        const strScalarRegExp = /^["'](.*)["']$/;
        if(!isNaN(s as unknown as number))
            return { scalar: parseInt(s) };
        else {
            const strScalarREMatch = s.match(strScalarRegExp);
            if(strScalarREMatch && strScalarREMatch[1] !== undefined){
                return { scalar: strScalarREMatch[1] };
            } else {
                return parseScopeReference(s);
            }
        }
    };

    return {
        operator: operator as RuleConditionOperator,
        leftInput: conditionInputFromStr(leftInput),
        rightInput: conditionInputFromStr(rightInput)
    };
}