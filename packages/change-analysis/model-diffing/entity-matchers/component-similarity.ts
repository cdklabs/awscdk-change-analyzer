import { Component } from "change-analysis-models";
import { PropertyDiffCreator } from "../property-diff";
import { PropertyComponentOperation } from "change-analysis-models";
import { CompleteTransition } from "change-analysis-models";

/**
 * Component similarity evaluator for use with matchEntities.
 * 
 * Matches components based on the type, subtype and property similarity.
 * The metadata object in the matcher results will be the PropertyComponentOperation
 * from Component v1 to Component v2. It can be undefined if the Components are exactly alike
 */
export function componentSimilarityEvaluator(t: CompleteTransition<Component>): [number, PropertyComponentOperation | undefined] | undefined {
    if(t.v1.type !== t.v2.type || t.v1.subtype !== t.v2.subtype)
        return;
    
    const propertyDiff = new PropertyDiffCreator(t).create(t.v1.properties, t.v2.properties);

    return [propertyDiff.similarity, propertyDiff.operation];
}

export function sameNameComponentSimilarityEvaluator(t: CompleteTransition<Component>): [number, PropertyComponentOperation | undefined] | undefined {
    if(t.v1.name !== t.v2.name)
        return;
    return componentSimilarityEvaluator(t);
}
