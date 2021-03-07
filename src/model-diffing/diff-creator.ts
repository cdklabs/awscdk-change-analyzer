import { Component, InfraModel, Relationship } from "../infra-model";
import { ComponentsMatcher } from "./entity-matchers/components-matcher";
import { EntitiesMatcherResults } from "./entity-matchers/entities-matcher";
import {
    InsertComponentOperation,
    RemoveComponentOperation,
    RenameComponentOperation,
    ComponentOperation,
    RemoveOutgoingComponentOperation,
    InsertOutgoingComponentOperation,
    UpdateOutgoingComponentOperation,
    PropertyComponentOperation,
} from "./operations";
import { groupArrayBy } from "../utils/arrayUtils";
import { RelationshipsMatcher } from "./entity-matchers/relationships-matcher";
import { isDefined } from "../utils";
import { Transition } from "./transition";
import { InfraModelDiff } from "./infra-model-diff";

export class DiffCreator {
    
    componentTransitions: Transition<Component>[] = [];
    entityVersionToTransitionMap = new Map<Component | Relationship, Transition<Component | Relationship>>();
    

    constructor(
        public readonly modelTransition: Transition<InfraModel>
    ){}

    public create(): InfraModelDiff{
        if(!this.modelTransition.v1 || !this.modelTransition.v2)
            throw Error("Cannot diff model transition with undefined model version");
        const oldComponentsSplit = this.splitComponentsByType(this.modelTransition.v1.components);
        const newComponentsSplit = this.splitComponentsByType(this.modelTransition.v2.components);

        const componentOperations: ComponentOperation[] = [];

        const categories = [...new Set([...oldComponentsSplit.keys(), ...newComponentsSplit.keys()])];

        componentOperations.push(...categories.flatMap((type) =>
            this.diffComponents(
                oldComponentsSplit.get(type) ?? [],
                newComponentsSplit.get(type) ?? []
            ),
        ));
        componentOperations.push(...this.componentTransitions.flatMap(
            ct => this.diffComponentRelationships(ct))
        );

        return new InfraModelDiff(componentOperations, this.componentTransitions);
    }

    /**
     * Finds matches between equally named components and between any remaining ones;
     * Returns the ComponentOperations that correspond to each component change
     * @param oldComponents The old components to match
     * @param newComponents The new components to match
     */
    private diffComponents(oldComponents: Component[], newComponents: Component[]): ComponentOperation[]{

        const sameNameMatches = this.matchComponents(
            oldComponents,
            newComponents,
            (a: Component, b: Component) => a.name === b.name
        );

        const renamedMatches = this.matchComponents(
            sameNameMatches.unmatchedA,
            sameNameMatches.unmatchedB
        );

        const updates = [...sameNameMatches.matches, ...renamedMatches.matches].map(
            ({metadata: propOp}) => propOp
        ).filter(isDefined);
        const renames = renamedMatches.matches.map(({transition}) => new RenameComponentOperation(transition));
        const removals = renamedMatches.unmatchedA.map(c => new RemoveComponentOperation(c));
        const insertions = renamedMatches.unmatchedB.map(c => new InsertComponentOperation(c));
        
        return [...removals, ...insertions, ...renames, ...updates];
    }

    /**
     * Uses the ComponentMatcher to find the matches between two sets of Components
     * and registers the obtained component transitions.
     * @returns the ComponentMatcher's results
     */
    private matchComponents(
        a: Component[],
        b: Component[],
        additionalVerification?: ((a: Component, b: Component) => boolean)
    ): EntitiesMatcherResults<Component, PropertyComponentOperation | undefined> {
        const matcherResults = new ComponentsMatcher(a, b).match(additionalVerification);
        matcherResults.matches.forEach(({transition}) => this.componentTransitions.push(transition));
        return matcherResults;
    }

    /**
     * Finds matches between relationships of the matched components;
     * @returns the ComponentOperations that correspond to each relationship change
     */
    private diffComponentRelationships(componentTransition: Transition<Component>): ComponentOperation[] {
        const relationshipMatches = new RelationshipsMatcher(
            [...componentTransition.v1?.outgoing ?? []],
            [...componentTransition.v2?.outgoing ?? []]
        ).match();

        const removals = relationshipMatches.unmatchedA.map(r =>
            new RemoveOutgoingComponentOperation(componentTransition, r));
        const insertions = relationshipMatches.unmatchedB.map(r =>
            new InsertOutgoingComponentOperation(componentTransition, r));

        const updates = relationshipMatches.matches
            .filter(({metadata: updated}) => updated)
            .map(({transition}) => new UpdateOutgoingComponentOperation(
                componentTransition,
                transition
        ));

        return [...removals, ...insertions, ...updates];
    }

    /**
     * Splits components according to their type and subtype
     * @param components 
     */
    private splitComponentsByType(components: Component[]): Map<string, Component[]>{
        return groupArrayBy(components, (c: Component) => `${c.type}-${c.subtype}`);
    }
}
