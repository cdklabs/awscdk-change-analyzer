import { ModelEntity, Serialized, RuleEffect } from '@aws-c2a/models';
import * as fn from 'fifinet';
import { flatMap } from '../private/node';
import {
  appliesToHandler,
  isContainedInHandler,
  containsHandler,
  isReferencedInHandler,
  referencesHandler,
} from './operator-handlers';
import { equalsHandler } from './operator-handlers/equals';
import {
  UserRules,
  UserRule,
  RuleEffectDefinition,
  Selector,
  selectorIsReference,
  RuleConditions,
  RuleConditionOperator,
  isInputScalar,
} from './rule';

/**
 * Process user rules and assign rule effects to the respective vertices in the graph
 */
export type RulesScope = Record<string, ScopeNode>;
export type RuleOutput = Map<fn.Vertex<any, any>, RuleEffect>;

type VertexScopeNode = {
  vertex: fn.Vertex<any, any>;
}
export function isScopeVertex(n: ScopeNode): n is VertexScopeNode { return {}.hasOwnProperty.call(n, 'vertex'); }
type ValueScopeNode = {
  value: Serialized
}
export function isScopeValue(n: ScopeNode): n is ValueScopeNode { return {}.hasOwnProperty.call(n, 'value'); }
export type ScopeNode = VertexScopeNode | ValueScopeNode;
function vertexToScopeNode(vertex: fn.Vertex<any, any>): VertexScopeNode {
  return {vertex};
}
function scalarToScopeNode(value: fn.Vertex<any, any>) {
  return {value};
}


export type OperatorHandler = <V, E>(g: fn.Graph<V, E>, t1: ScopeNode, t2: ScopeNode) => boolean;

const operatorToHandler: Record<RuleConditionOperator, OperatorHandler> = {
  [RuleConditionOperator.appliesTo]: appliesToHandler,
  [RuleConditionOperator.equals]: equalsHandler,
  [RuleConditionOperator.references]: referencesHandler,
  [RuleConditionOperator.isReferencedIn]: isReferencedInHandler,
  [RuleConditionOperator.contains]: containsHandler,
  [RuleConditionOperator.isContainedIn]: isContainedInHandler,
};

const propertyPathWildcard = '*';

export class RuleProcessor {

  constructor(
    private readonly graph: fn.Graph<any, any & {_label: string, _in:string, _out:string}>,
  ){}

  /**
     * Assigns rule effects to specific vertices in the graph, based on the provided user rules
     */
  public processRules(rules: UserRules): RuleOutput {
    return this.processRulesWithScope(rules, {});
  }

  private processRulesWithScope(rules: UserRules, scope: RulesScope): RuleOutput {
    return new Map([...flatMap(rules, r => [...this.processRule(r, scope)])]);
  }

  private processRule(rule: UserRule, currentScope: RulesScope): RuleOutput{
    const newScopes = this.getScopesFromDeclarations(rule, currentScope);
    return new Map([...flatMap(newScopes, (newScope): [ModelEntity, RuleEffect][] => {
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

  private getScopesFromDeclarations(rule: UserRule, currentScope: RulesScope): RulesScope[] {
    let newScopes: RulesScope[] = [{...currentScope}];
    Object.entries(rule.let ?? []).forEach(
      ([identifier, selector]) => {
        newScopes = flatMap([...newScopes], (scope): RulesScope[] => {
          const newScopeNodes = this.processDefinition(identifier, selector, scope);
          if(!newScopeNodes.length)
            return [scope];
          return newScopeNodes.map(e => ({...scope, [identifier]: e}));
        });
      },
    );

    return newScopes.filter(scope => this.verifyConditions(rule.where ?? [], scope));
  }

  private processDefinition(identifier: string, selector: Selector, scope: RulesScope): ScopeNode[]{
    let candidates: ScopeNode[] = [];

    if(selectorIsReference(selector)){
      const identifierModelEntity = scope[selector.propertyReference.identifier];
      if(identifierModelEntity === undefined)
        return [];
      candidates = this.navigateToPath(
        identifierModelEntity,
        selector.propertyReference.propertyPath,
      ).filter(fn.isDefined);
    } else {
      candidates = this.graph.v(selector.filter).run().map(vertexToScopeNode);
    }

    return candidates.filter(candidate => {
      const newScope = {...scope, [identifier]: candidate};
      return this.verifyConditions(
        selector.where ?? [],
        newScope,
      );
    });
  }

  private navigateToPath(entity: ScopeNode, path?: string[]): ScopeNode[] {
    if(entity === undefined) return [];
    if(!path || path.length === 0) return [entity];

    if(isScopeVertex(entity)) {
      const traverse = (conditions: any): VertexScopeNode[] =>
        this.graph.v(entity.vertex).outAny(conditions).run().map(vertexToScopeNode);
      const newPropertyScopeNodes = traverse({_label: 'hasProperties'});
      const nestedPropertyScopeNodes = traverse({_label: 'value', ...path[0] === propertyPathWildcard ? {} : {key: path[0]}});
      const exposesValuesScopeNodes = traverse({_label: 'exposesValues', key: path[0]});

      return [
        ...flatMap(newPropertyScopeNodes, v => this.navigateToPath(v, path)),
        ...flatMap(nestedPropertyScopeNodes, v => this.navigateToPath(v, path.slice(1))),
        ...flatMap(exposesValuesScopeNodes, v => this.navigateToPath(v, path.slice(1))),
        ...[entity.vertex[path[0]]].filter(fn.isDefined).map(scalarToScopeNode) ?? [],
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
    scope: RulesScope,
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

      const approved = leftCandidates.reduce((outterAcc, l) => {
        return outterAcc || rightCandidates.reduce((innerAcc, r) => {
          return innerAcc || (l && r && Object.values(RuleConditionOperator).includes(c.operator))
            ? operatorToHandler[c.operator](this.graph, l, r)
            : false;
        }, false);
      }, false);
      if(!approved) return false;
    }
    return true;
  }
}