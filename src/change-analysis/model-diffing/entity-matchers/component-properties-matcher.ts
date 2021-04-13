import { Component, ComponentProperty, PropertyPath } from "change-cd-iac-models/infra-model";
import { PropertyDiff, PropertyDiffCreator } from "../property-diff";
import { CompleteTransition, Transition } from "change-cd-iac-models/model-diffing/transition";

/**
 * ComponentProperty similarity evaluator for use with matchEntities.
 * 
 * Matches ComponentProperties based on their similarity.
 * The metadata object in the matcher results will be the PropertyDiff
 * 
 * K values are the properties' keys/identifiers
 */
export function propertySimilarityEvaluatorCreator<K extends (string | number)>(
    componentTransition: Transition<Component>,
    keyAToProperty: Record<K, ComponentProperty>,
    keyBToProperty: Record<K, ComponentProperty>,
    basePathA?: PropertyPath,
    basePathB?: PropertyPath,
){

    return ({v1: keyV1, v2: keyV2}: CompleteTransition<K>): [number, PropertyDiff] => {
        const propDiff = new PropertyDiffCreator(componentTransition).create(
            keyAToProperty[keyV1],
            keyBToProperty[keyV2],
            [...(basePathA ?? []), keyV1],
            [...(basePathB ?? []), keyV2]);
        return [propDiff.similarity, propDiff];
    };
}