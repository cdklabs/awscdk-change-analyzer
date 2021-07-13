import { Component, InfraModel, Relationship } from "cdk-change-analyzer-models";
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
    PropertyComponentOperation,
    Transition,
    InfraModelDiff,
    TransitionVersions
} from "cdk-change-analyzer-models";
import { groupArrayBy } from "cdk-change-analyzer-models";
import { isDefined } from "cdk-change-analyzer-models";
import {
    componentSimilarityEvaluator,
    sameNameComponentSimilarityEvaluator
} from "./entity-matchers/component-similarity";

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

        return new InfraModelDiff(componentOperations, this.componentTransitions, this.modelTransition);
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
        const renames = renamedMatches.matches.map(({transition}) => new RenameComponentOperation({}, {componentTransition: transition}));
        const removals = renamedMatches.unmatchedA.map(c => new RemoveComponentOperation({}, {componentTransition: this.createComponentTransition({v1: c})}));
        const insertions = renamedMatches.unmatchedB.map(c => new InsertComponentOperation({}, {componentTransition: this.createComponentTransition({v2: c})}));
        
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
     * Creates and registers a new component transition.
     * @returns the transition
     */
    private createComponentTransition(
        versions: TransitionVersions<Component>
    ): Transition<Component> {
        const t = new Transition<Component>(versions);
        this.componentTransitions.push(t);
        return t;
    }

    /**
     * Splits components according to their type and subtype
     * @param components 
     */
    private groupComponentsByType(components: Component[]): Map<string, Component[]>{
        return groupArrayBy(components, (c: Component) => `${c.type}-${c.subtype}`);
    }
}
