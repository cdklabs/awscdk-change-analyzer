import { Component, Relationship } from "change-cd-iac-models/infra-model";
import { stringSimilarity } from "change-cd-iac-models/utils";
import { CompleteTransition, Transition } from "change-cd-iac-models/model-diffing";

/**
 * Relationship similarity evaluator for use with matchEntities.
 * 
 * Matches relationships based on their class and type similarity.
 * The metadata object in the matcher results will be a boolean value that
 * states if the relationship was changed or not
 */
export const relationshipSimilarityEvaluatorCreator = (versionToTransitionMap: Map<Component | Relationship, Transition<Component | Relationship>>) => ({v1, v2}: CompleteTransition<Relationship>): [number, boolean] | undefined => {
    if(!(v2 instanceof v1.constructor))
        return;

    const typeSimilarity = stringSimilarity(v1.type, v2.type);
    
    const targetMatchSimilarity = versionToTransitionMap.get(v1.target) === versionToTransitionMap.get(v2.target) ? 1 : 0;
    const sourceMatchSimilarity = versionToTransitionMap.get(v1.source) === versionToTransitionMap.get(v2.source) ? 1 : 0;

    const similarity = (typeSimilarity + targetMatchSimilarity + sourceMatchSimilarity) / 3; 

    return [similarity, similarity < 1];
};