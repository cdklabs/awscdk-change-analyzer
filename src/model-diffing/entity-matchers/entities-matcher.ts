import { isDefined } from "../../utils";

// Two Components will be matched only if their similarity is above the similarity threshold 
const similarityThreshold = 0.5;

export type EntityMatches<T> = Map<T, {entity: T, similarity: number}>;

/**
 * EntitiesMatcher is responsible for matching entities according
 * to a specific entity similarity function. It has a greedy strategy that always
 * matches the most similar entities first.
 * 
 * Entities with similarity below 'similarityThreshold' will never be matched
 */
export abstract class EntitiesMatcher<T> {

    private readonly matchesAToB: Map<T, EntityMatches<T>> = new Map();
    private readonly matchesBToA: Map<T, EntityMatches<T>> = new Map();

    private readonly entitiesA: T[];
    private readonly entitiesB: T[];

    constructor(
        entitiesA: T[],
        entitiesB: T[]
    ) {
        this.entitiesA = entitiesA;
        this.entitiesB = entitiesB;
    }

    /**
     * Evaluates and returns the valid matches between entitiesA and entitiesB, optionally filtering possible matches
     * with an additional condition
     * @param additionalVerification the additional condition that filters the matches that should be evaluated
     */
    public match(
        additionalVerification?: (a: T, b: T) => boolean
    ): EntityMatches<T> {
        
        const matchesBySimilarity = this.findMatchesDecreasingSimilarity(additionalVerification);
        
        const matchedEntitiesA = new Set<T>();
        const matchedEntitiesB = new Set<T>();
        
        return new Map(
            matchesBySimilarity.map(([similarity, entA, entB]): [T, {entity: T, similarity: number}] | undefined => 
                !matchedEntitiesA.has(entA) && !matchedEntitiesB.has(entB)
                    ? [entA, {similarity, entity: entB}]
                    : undefined
            ).filter(isDefined)
        );
    }

    /**
     * Finds the valid matches and orders them in descending order of similarity
     * @param additionalVerification the additional condition that filters the matches that should be evaluated
     */
    private findMatchesDecreasingSimilarity(additionalVerification?: (a: T, b: T) => boolean): [number, T, T][]{
        const matches: [number, T, T][] =
            this.entitiesA.flatMap(entityA =>
                this.entitiesB.map((entityB): [number, T, T] | undefined => {
                    if(additionalVerification && !additionalVerification(entityA, entityB))
                        return undefined;
                        
                    const similarity = this.calcEntitySimilarity(entityA, entityB);

                    if(similarity >= similarityThreshold)
                        return [similarity, entityA, entityB];
                    return undefined;
                })
            ).filter(isDefined);

        return matches.sort((m1, m2) => m1[0] > m2[0] ? 0 : 1);
    }

    /**
     * The method that should be implemented to calculate the similarity between two entities
     * @param a the first entity
     * @param b the second entity
     */
    protected abstract calcEntitySimilarity(a: T, b: T): number;
        
}