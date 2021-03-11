import { Component, InfraModel, Relationship } from "../infra-model";
import {
    EntitiesMatcherResults,
    matchEntities,
    SimilarityEvaluator
} from "./entity-matchers/entities-matcher";
import {
    InsertComponentOperation,
    RemoveComponentOperation,
    RenameComponentOperation,
    ComponentOperation,
    RemoveOutgoingRelationshipComponentOperation,
    InsertOutgoingRelationshipComponentOperation,
    UpdateOutgoingRelationshipComponentOperation,
    PropertyComponentOperation,
} from "./operations";
import { groupArrayBy } from "../utils/arrayUtils";
import { isDefined } from "../utils";
import { Transition } from "./transition";
import { InfraModelDiff } from "./infra-model-diff";
import {
    componentSimilarityEvaluator,
    sameNameComponentSimilarityEvaluator
} from "./entity-matchers/component-similarity";
import { relationshipSimilarityEvaluator } from "./entity-matchers/relationship-similarity";

const similarityThreshold = 0.5;

export class DiffCreator {
    
    componentTransitions: Transition<Component>[] = [];
    entityVersionToTransitionMap = new Map<Component | Relationship, Transition<Component | Relationship>>();
    

    constructor(
        public readonly modelTransition: Transition<InfraModel>
    ){}

    public create(): InfraModelDiff{
        if(!this.modelTransition.v1 || !this.modelTransition.v2)
            throw Error("Cannot diff model transition with undefined model version");

        // Grouping components by their type and subtype for performance reasons, since their matching will test them n*n.
        // We are reducing the amount of candidates that will be explored for each component
        const oldComponentsGrouped = this.groupComponentsByType(this.modelTransition.v1.components);
        const newComponentsGrouped = this.groupComponentsByType(this.modelTransition.v2.components);

        const componentOperations: ComponentOperation[] = [];

        const categories = [...new Set([...oldComponentsGrouped.keys(), ...newComponentsGrouped.keys()])];

        componentOperations.push(...categories.flatMap((type) =>
            this.diffComponents(
                oldComponentsGrouped.get(type) ?? [],
                newComponentsGrouped.get(type) ?? []
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
            sameNameComponentSimilarityEvaluator
        );

        const renamedMatches = this.matchComponents(
            sameNameMatches.unmatchedA,
            sameNameMatches.unmatchedB,
            componentSimilarityEvaluator
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
        similarityEvaluator: SimilarityEvaluator<Component, PropertyComponentOperation | undefined>
    ): EntitiesMatcherResults<Component, PropertyComponentOperation | undefined> {
        const matcherResults = matchEntities(a, b, similarityEvaluator, similarityThreshold);
        matcherResults.matches.forEach(({transition}) => this.componentTransitions.push(transition));
        return matcherResults;
    }

    /**
     * Finds matches between relationships of the matched components;
     * @returns the ComponentOperations that correspond to each relationship change
     */
    private diffComponentRelationships(componentTransition: Transition<Component>): ComponentOperation[] {
        const relationshipMatches = matchEntities(
            [...componentTransition.v1?.outgoing ?? []],
            [...componentTransition.v2?.outgoing ?? []],
            relationshipSimilarityEvaluator
        );

        const removals = relationshipMatches.unmatchedA.map(r =>
            new RemoveOutgoingRelationshipComponentOperation(componentTransition, r));
        const insertions = relationshipMatches.unmatchedB.map(r =>
            new InsertOutgoingRelationshipComponentOperation(componentTransition, r));

        const updates = relationshipMatches.matches
            .filter(({metadata: updated}) => updated)
            .map(({transition}) => new UpdateOutgoingRelationshipComponentOperation(
                componentTransition,
                transition
        ));

        return [...removals, ...insertions, ...updates];
    }

    /**
     * Splits components according to their type and subtype
     * @param components 
     */
    private groupComponentsByType(components: Component[]): Map<string, Component[]>{
        return groupArrayBy(components, (c: Component) => `${c.type}-${c.subtype}`);
    }
}
