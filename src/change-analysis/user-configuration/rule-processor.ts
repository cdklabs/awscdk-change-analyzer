import { ChangeAnalysisReport } from "change-cd-iac-models/change-analysis-report";
import { ModelEntity } from "change-cd-iac-models/infra-model/model-entity";
import * as fn from 'fifinet';


type UserRule = {
    let: Record<string, EntityDefinition>, // declarations
    where: string,
    then: UserRules,
};
type EntityDefinition = Record<string, string>;
type UserRules = UserRule[];

type RulesScope = Record<string, ModelEntity>;

class RuleProcessor {

    constructor(
        private readonly graph: fn.Graph<any, any>,
    ){}

    public parseRules(rules: UserRules) {
        return this.parseRulesWithScope(rules, {});
    }

    private parseRulesWithScope(rules: UserRules, scope: RulesScope){
        return rules.map(r => this.parseRule(r, scope));
    }

    private parseRule(rule: UserRule, currentScope: RulesScope){
        const newScopes = this.getScopesFromDeclarations(rule.let, currentScope);
    }

    private getScopesFromDeclarations(declarations: Record<string, EntityDefinition>, currentScope: RulesScope) {
        let newScopes = [{...currentScope}];
        Object.entries(declarations).forEach(
            ([identifier, definition]) => {
                newScopes = newScopes.flatMap(scope => 
                    []//this.parseDefinition(definition, scope).map(e => ({...scope, [identifier]: e}))
                );
            }
        );
    }

    //private parseDefinition(definition: EntityDefinition, scope: RulesScope): fn.Vertex<any, any>[]{
        //return this.graph.v(definition);
    //}

}