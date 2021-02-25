import { Component } from "../../infra-model";
import { EntitiesMatcher } from "./entities-matcher";
import { PropertyDiff } from "../property-diff";

/**
 * Matches components based on the type, subtype and property similarity 
 */
export class ComponentsMatcher extends EntitiesMatcher<Component> {

    // stores the generated property diffs
    public readonly propertyDiffs: Map<Component, PropertyDiff> = new Map();

    protected calcEntitySimilarity(a: Component, b: Component): number {
        if(a.type !== b.type || a.subtype !== b.subtype)
            return 0;
        
        const propertyDiff = PropertyDiff.fromProperties(a.properties, b.properties);
        this.propertyDiffs.set(a, propertyDiff);

        return propertyDiff.similarity;
    }
}