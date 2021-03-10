import { Relationship } from "../../infra-model";
import { stringSimilarity } from "../../utils";
import { CompleteTransition } from "../transition";

/**
 * Relationship similarity evaluator for use with matchEntities.
 * 
 * Matches relationships based on their class and type similarity.
 * The metadata object in the matcher results will be a boolean value that
 * states if the relationship was changed or not
 */
export function relationshipSimilarityEvaluator({v1, v2}: CompleteTransition<Relationship>): [number, boolean] | undefined {
    if(!(v2 instanceof v1.constructor))
        return;

    const similarity = stringSimilarity(v1.type, v2.type);

    return [similarity, similarity < 1];
}