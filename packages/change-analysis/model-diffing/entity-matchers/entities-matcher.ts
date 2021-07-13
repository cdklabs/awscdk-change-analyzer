import { isDefined } from "cdk-change-analyzer-models";
import { CompleteTransition, Transition } from "cdk-change-analyzer-models";
import { JSONSerializable, Serialized } from "cdk-change-analyzer-models";

type ValidEntity = JSONSerializable | Serialized;

export type EntityMatch<T extends ValidEntity, K = undefined> = {
    transition: Transition<T>,
    metadata: K,
}

export type EntitiesMatcherResults<T extends ValidEntity, K = undefined> = {
    unmatchedA: T[],
    unmatchedB: T[],
    matches: EntityMatch<T, K>[]
}

export type SimilarityEvaluator<T extends ValidEntity, K> = (t: CompleteTransition<T>) => [number, K] | undefined;

/**
 * Evaluates and returns the valid matches between entitiesA and entitiesB
 * @param similarityEvaluator the function used to evaluate similarity. Returns [number, K],
 * where number is the similarity and K the metadata for that match. Returns undefined if they're not a possible match.
 * @param similarityThreshold the value for similarity above which two entities can match
 */
export function matchEntities<T extends ValidEntity, K = undefined>(
    entitiesA: T[],
    entitiesB: T[],
    similarityEvaluator: SimilarityEvaluator<T, K>,
    similarityThreshold = 0.5,
): EntitiesMatcherResults<T, K> {
    
    const matchesBySimilarity = findMatchesDecreasingSimilarity(
        entitiesA,
        entitiesB,
        similarityEvaluator,
        similarityThreshold
    );
    
    const matchedA = new Set<T>();
    const matchedB = new Set<T>();
    
    const matches = matchesBySimilarity.map(
        (entityMatch): EntityMatch<T, K> | undefined => {
            if(entityMatch.transition.v1 === undefined || entityMatch.transition.v2 === undefined)
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

    const unmatchedA = entitiesA.filter(e => !matchedA.has(e));
    const unmatchedB = entitiesB.filter(e => !matchedB.has(e));

    return {matches, unmatchedA, unmatchedB};
}

/**
 * Finds the valid matches and orders them in descending order of similarity
 * @param additionalVerification the additional condition that filters the matches that should be evaluated
 */
function findMatchesDecreasingSimilarity<T extends ValidEntity, K>(
    entitiesA: T[],
    entitiesB: T[],
    similarityEvaluator: SimilarityEvaluator<T, K>,
    similarityThreshold: number
): EntityMatch<T,K>[] {

    if(similarityThreshold < 0 || similarityThreshold > 1)
        throw Error("Similarity threshold must be a value between 0 and 1");

    const matches: [number, EntityMatch<T,K>][] =
        entitiesA.flatMap(entityA =>
            entitiesB.map((entityB): [number, EntityMatch<T,K>] | undefined => {

                const transition = new CompleteTransition({v1: entityA, v2: entityB});

                const similarityCalcResult = similarityEvaluator(transition);

                if(!similarityCalcResult)
                    return;

                const [similarity, metadata] = similarityCalcResult;
                if(similarity < 0 || similarity > 1)
                    throw Error("Similarity does not have a value in the range [0, 1]");
                
                if(similarity > similarityThreshold)
                    return [similarity, {transition, metadata}];

                return;
            })
        ).filter(isDefined);

    return matches.sort((m1, m2) => m1[0] > m2[0] ? -1 : 1).map(([, entityMatch]) => entityMatch);
}