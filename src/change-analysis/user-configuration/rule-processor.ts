import { Serialized } from "change-cd-iac-models/export/json-serializable";
import { ModelEntity } from "change-cd-iac-models/infra-model/model-entity";
import { isDefined } from "change-cd-iac-models/utils";
import * as fn from 'fifinet';
import { UserRule, Bindings, RuleEffectDefinition, Selector, selectorIsPropertyReference } from "./rule";
import { RuleEffect } from 'change-cd-iac-models/rules';

type UserRules = UserRule[];

type RulesScope = Record<string, fn.Vertex<any, any>>;
type RuleOutput = Map<fn.Vertex<any, any>, RuleEffect>;

type VertexScopeNode = {
    vertex: fn.Vertex<any, any>;
}
function isScopeVertex(n: ScopeNode): n is VertexScopeNode { return {}.hasOwnProperty.call(n, 'vertex'); }
type ValueScopeNode = {
    value: Serialized
}
function isScopeValue(n: ScopeNode): n is ValueScopeNode { return {}.hasOwnProperty.call(n, 'value'); }
type ScopeNode = VertexScopeNode | ValueScopeNode;

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
        return new Map([[scope[target].vertex, effect]]);
    }

    private getScopesFromDeclarations(
        bindings: Bindings, currentScope: RulesScope
    ): RulesScope[] {
        let newScopes: RulesScope[] = [{...currentScope}];
        Object.entries(bindings).forEach(
            ([identifier, selector]) => {
                newScopes = newScopes.flatMap(scope => 
                    this.processDefinition(selector, scope).map(e => ({...scope, [identifier]: e}))
                );
            }
        );
        return newScopes;
    }

    private processDefinition(selector: Selector, scope: RulesScope): ScopeNode[]{
        if(selectorIsPropertyReference(selector)){
            const identifierModelEntity = scope[selector.propertyReference.identifier];
            if(identifierModelEntity === undefined)
                return [];
            return [...this.navigateToPath(identifierModelEntity, selector.propertyReference.propertyPath)].filter(isDefined);
        }

        return this.graph.v(selector.filter).run().map(vertex => ({vertex}));
    }

    private navigateToPath(entity: ScopeNode, path: string[]): ScopeNode[] {
        if(path.length === 0) return [entity];
        
        if(isScopeVertex(entity)) {
            const newPropertyVertices = this.graph.v(entity.vertex).outAny({_label: 'hasProperties'}).run().map(vertex => ({vertex}));
            const nestedPropertyVertices = this.graph.v(entity.vertex).outAny({_label: 'value', key: path[0]}).run().map(vertex => ({vertex}));
            return [
                ...newPropertyVertices.flatMap(v => this.navigateToPath(v, path)),
                ...nestedPropertyVertices.flatMap(v => this.navigateToPath(v, path.slice(1))),
                ...[entity.vertex[path[0]]] ?? [],
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
}