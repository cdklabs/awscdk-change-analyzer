import { ComponentProperty, PropertyPath } from "../../infra-model";
import { PropertyDiff } from "../property-diff";
import { EntitiesMatcher } from "./entities-matcher";

/**
 * Matches ComponentProperties based on their similarity 
 */
export class ComponentPropertiesMatcher<K extends (string | number)> extends EntitiesMatcher<[K, ComponentProperty], PropertyDiff> {

    constructor(
        entitiesA: [K, ComponentProperty][],
        entitiesB: [K, ComponentProperty][],
        private readonly basePathA?: PropertyPath,
        private readonly basePathB?: PropertyPath
    ){
        super(entitiesA, entitiesB);
    }

    protected calcEntitySimilarity(a: [K, ComponentProperty], b: [K, ComponentProperty]): [number, PropertyDiff] {
        const propDiff = PropertyDiff.fromProperties(
            a[1],
            b[1],
            [...(this.basePathA ?? []), a[0]],
            [...(this.basePathB ?? []), b[0]]);
        return [propDiff.similarity, propDiff];
    }
}