import { Component } from "../../infra-model";
import { EntitiesMatcher } from "./entities-matcher";
import { PropertyDiff } from "../property-diff";
import { PropertyOperation } from "../operations";

/**
 * Matches components based on the type, subtype and property similarity 
 */
export class ComponentsMatcher extends EntitiesMatcher<Component, PropertyOperation | undefined> {

    protected calcEntitySimilarity(a: Component, b: Component): [number, PropertyOperation | undefined] | undefined {
        if(a.type !== b.type || a.subtype !== b.subtype)
            return;
        
        const propertyDiff = PropertyDiff.fromProperties(a.properties, b.properties);

        return [propertyDiff.similarity, propertyDiff.operation];
    }
}