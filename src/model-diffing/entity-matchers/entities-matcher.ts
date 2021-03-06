import { isDefined } from "../../utils";
import { CompleteTransition, Transition } from "../transition";

export type EntityMatches<T, K = undefined> = Map<T, {entity: T, similarity: number, metadata?: K}>;

export type EntityMatch<T, K = undefined> = {
    transition: Transition<T>,
    metadata: K,
}

export type EntitiesMatcherResults<T, K = undefined> = {
    unmatchedA: T[],
    unmatchedB: T[],
    matches: EntityMatch<T, K>[]
}

/**
 * EntitiesMatcher is responsible for matching entities according
 * to a specific entity similarity function. It has a greedy strategy that always
 * matches the most similar entities first.
 * 
 * Entities with similarity below 'similarityThreshold' will never be matched
 */
export abstract class EntitiesMatcher<T, K = undefined> {

    private readonly matchesAToB: Map<T, EntityMatches<T, K>> = new Map();
    private readonly matchesBToA: Map<T, EntityMatches<T, K>> = new Map();
    
    // Two Components will be matched only if their similarity is above the similarity threshold 
    public static similarityThreshold = 0.5;

    constructor(
        private readonly entitiesA: T[],
        private readonly entitiesB: T[]
    ) {}

    /**
     * Evaluates and returns the valid matches between entitiesA and entitiesB, optionally filtering possible matches
     * with an additional condition
     * @param additionalVerification the additional condition that filters the matches that should be evaluated
     */
    public match(
        additionalVerification?: (a: T, b: T) => boolean
    ): EntitiesMatcherResults<T, K> {
        
        const matchesBySimilarity = this.findMatchesDecreasingSimilarity(additionalVerification);
        
        const matchedA = new Set<T>();
        const matchedB = new Set<T>();
        
        const matches = matchesBySimilarity.map(
            (entityMatch): EntityMatch<T, K> | undefined => {
                if(!entityMatch.transition.v1 || !entityMatch.transition.v2)
                    throw Error("EntityMatcher produced transition with undefined version");
                if(!matchedA.has(entityMatch.transition.v1)
                    && !matchedB.has(entityMatch.transition.v2)) {
                        matchedA.add(entityMatch.transition.v1);
                        matchedB.add(entityMatch.transition.v2);
                        return entityMatch;
                }
                return;
            }
        ).filter(isDefined);

        const unmatchedA = this.entitiesA.filter(e => !matchedA.has(e));
        const unmatchedB = this.entitiesB.filter(e => !matchedB.has(e));

        return {matches, unmatchedA, unmatchedB};
    }

    /**
     * Finds the valid matches and orders them in descending order of similarity
     * @param additionalVerification the additional condition that filters the matches that should be evaluated
     */
    private findMatchesDecreasingSimilarity(additionalVerification?: (a: T, b: T) => boolean): EntityMatch<T,K>[]{
        const matches: [number, EntityMatch<T,K>][] =
            this.entitiesA.flatMap(entityA =>
                this.entitiesB.map((entityB): [number, EntityMatch<T,K>] | undefined => {
                    if(additionalVerification && !additionalVerification(entityA, entityB))
                        return undefined;
                        
                    const transition: CompleteTransition<T> = {v1: entityA, v2: entityB};
                    const similarityCalcResult = this.calcEntitySimilarity(transition);
                    if(!similarityCalcResult)
                        return;

                    const [similarity, metadata] = similarityCalcResult;
                    if(similarity > (<any>this.constructor).similarityThreshold)
                        return [similarity, {transition, metadata}];

                    return;
                })
            ).filter(isDefined);

        return matches.sort((m1, m2) => m1[0] > m2[0] ? 0 : 1).map(([, entityMatch]) => entityMatch);
    }

    /**
     * The method that should be implemented to calculate the similarity between two entities
     * @param a the first entity
     * @param b the second entity
     */
    protected abstract calcEntitySimilarity(t: CompleteTransition<T>): [number, K] | undefined;
}