import { Serialized } from "change-analysis-models";
import { ModelEntity } from "change-analysis-models";
import { isDefined } from "change-analysis-models";
import * as fn from 'fifinet';
import { UserRule, Bindings, RuleEffectDefinition, Selector, selectorIsReference, RuleConditions, RuleConditionOperator, isInputScalar } from "./rule";
import { RuleEffect } from 'change-analysis-models';
import { appliesToHandler } from './operator-handlers';
import { equalsHandler } from "./operator-handlers/equals";

type UserRules = UserRule[];

type RulesScope = Record<string, ScopeNode>;
type RuleOutput = Map<fn.Vertex<any, any>, RuleEffect>;

type VertexScopeNode = {
    vertex: fn.Vertex<any, any>;
}
export function isScopeVertex(n: ScopeNode): n is VertexScopeNode { return {}.hasOwnProperty.call(n, 'vertex'); }
type ValueScopeNode = {
    value: Serialized
}
export function isScopeValue(n: ScopeNode): n is ValueScopeNode { return {}.hasOwnProperty.call(n, 'value'); }
export type ScopeNode = VertexScopeNode | ValueScopeNode;
function vertexToScopeNode(vertex: fn.Vertex<any, any>) {
    return {vertex};
}
function scalarToScopeNode(value: fn.Vertex<any, any>) {
    return {value};
}


export type OperatorHandler = <V, E>(g: fn.Graph<V, E>, t1: ScopeNode, t2: ScopeNode) => boolean;

const operatorToHandler: Record<RuleConditionOperator, OperatorHandler> = {
    [RuleConditionOperator.appliesTo]: appliesToHandler,
    [RuleConditionOperator.equals]: equalsHandler,
};

const propertyPathWildcard = "*";

export class RuleProcessor {

    constructor(
        private readonly graph: fn.Graph<any, any & {_label: string, _in:string, _out:string}>,
    ){}

    public processRules(rules: UserRules): RuleOutput {
        return this.processRulesWithScope(rules, {});
    }

    private processRulesWithScope(rules: UserRules, scope: RulesScope): RuleOutput {
        return new Map([...rules.flatMap(r => [...this.processRule(r, scope)])]);
    }

    private processRule(rule: UserRule, currentScope: RulesScope): RuleOutput{
        const newScopes = rule.let ? this.getScopesFromDeclarations(rule.let, currentScope) : [currentScope];

        return new Map([...newScopes.flatMap((newScope): [ModelEntity, RuleEffect][] => {
            let output = new Map<ModelEntity, RuleEffect>();
            if(rule.effect)
                output = new Map([...output, ...this.extractRuleEffect(newScope, rule.effect)]);
            if(rule.then)
                output = new Map([...output, ...this.processRulesWithScope(rule.then, newScope)]);
            return [...output];
        })]);
    }

    private extractRuleEffect(scope: RulesScope, effectDefinition: RuleEffectDefinition): RuleOutput {
        const {target, ...effect} = effectDefinition;
        const targetScopeNode = scope[target];
        if(targetScopeNode === undefined || isScopeValue(targetScopeNode))
            return new Map();
        return new Map([[targetScopeNode.vertex, effect]]);
    }

    private getScopesFromDeclarations(
        bindings: Bindings, currentScope: RulesScope
    ): RulesScope[] {
        let newScopes: RulesScope[] = [{...currentScope}];
        Object.entries(bindings).forEach(
            ([identifier, selector]) => {
                newScopes = newScopes.flatMap((scope): RulesScope[] => {
                    const newScopeNodes = this.processDefinition(identifier, selector, scope);
                    if(!newScopeNodes.length)
                        return [];
                    return newScopeNodes.map(e => ({...scope, [identifier]: e}));
                });
            }
        );
        return newScopes;
    }

    private processDefinition(identifier: string, selector: Selector, scope: RulesScope): ScopeNode[]{
        let candidates: ScopeNode[] = [];
        
        if(selectorIsReference(selector)){
            const identifierModelEntity = scope[selector.propertyReference.identifier];
            if(identifierModelEntity === undefined)
                return [];
            candidates = this.navigateToPath(identifierModelEntity, selector.propertyReference.propertyPath).filter(isDefined);
        } else {
            candidates = this.graph.v(selector.filter).run().map(vertexToScopeNode);
        }

        return candidates.filter(candidate => {
            const newScope = {...scope, [identifier]: candidate};
            return this.verifyConditions(
                selector.where ?? [],
                newScope
            );
        });
    }

    private navigateToPath(entity: ScopeNode, path?: string[]): ScopeNode[] {
        if(entity === undefined) return [];
        if(!path || path.length === 0) return [entity];
        
        if(isScopeVertex(entity)) {
            const newPropertyScopeNodes = this.graph.v(entity.vertex).outAny({_label: 'hasProperties'}).run().map(vertexToScopeNode);
            const nestedPropertyScopeNodes = this.graph.v(entity.vertex).outAny({_label: 'value', ...path[0] === propertyPathWildcard ? {} : {key: path[0]}}).run().map(vertexToScopeNode);
            const exposesValuesScopeNodes = this.graph.v(entity.vertex).outAny({_label: 'exposesValues', key: path[0]}).run().map(vertexToScopeNode);
            
            return [
                ...newPropertyScopeNodes.flatMap(v => this.navigateToPath(v, path)),
                ...nestedPropertyScopeNodes.flatMap(v => this.navigateToPath(v, path.slice(1))),
                ...exposesValuesScopeNodes.flatMap(v => this.navigateToPath(v, path.slice(1))),
                ...[entity.vertex[path[0]]].filter(isDefined).map(scalarToScopeNode) ?? [],
            ];
        } else if(isScopeValue(entity)){
            const value = entity.value;
            if(value === null || value == undefined) return [];
            if(typeof value === 'object'){
                return this.navigateToPath((value as Record<string, any>)[path[0]], path.slice(1));
            }
        }
        return [];
    }

    verifyConditions(
        conditions: RuleConditions,
        scope: RulesScope
    ): boolean {

        for(const c of conditions){
            const [leftCandidates, rightCandidates] = [c.leftInput, c.rightInput].map((i): ScopeNode[] => {
                if(isInputScalar(i)) return [{ value: i.scalar }];
                if(i.identifier === undefined) return [];
                return this.navigateToPath(scope[i.identifier], i.propertyPath ?? []);
            });
            if(leftCandidates.length === 0 || rightCandidates.length === 0){
                return false;
            }

            const approved =
                leftCandidates.reduce((outterAcc, l) =>
                    outterAcc || rightCandidates.reduce((innerAcc, r) => {
                        if(l !== undefined && r !== undefined
                            && Object.values(RuleConditionOperator).includes(c.operator)){
                            return innerAcc || operatorToHandler[c.operator](this.graph, l, r);
                        }
                        return innerAcc;
                    }, false
                ), false
            );
            if(!approved) return false;
        }
        return true;
    }
}