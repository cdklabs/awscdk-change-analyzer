import { Component, ComponentProperty, PropertyPath } from "../../infra-model";
import { PropertyDiff, PropertyDiffCreator } from "../property-diff";
import { CompleteTransition, Transition } from "../transition";
import { EntitiesMatcher } from "./entities-matcher";

/**
 * Matches ComponentProperties based on their similarity.
 * The metadata object in the matcher results will be the PropertyDiff
 */
export class ComponentPropertiesMatcher<K extends (string | number)> extends EntitiesMatcher<[K, ComponentProperty], PropertyDiff> {

    constructor(
        entitiesA: [K, ComponentProperty][],
        entitiesB: [K, ComponentProperty][],
        private readonly componentTransition: Transition<Component>,
        private readonly basePathA?: PropertyPath,
        private readonly basePathB?: PropertyPath
    ){
        super(entitiesA, entitiesB);
    }

    protected calcEntitySimilarity({v1: [keyV1, propV1], v2: [keyV2, propV2]}: CompleteTransition<[K, ComponentProperty]>): [number, PropertyDiff] {
        const propDiff = new PropertyDiffCreator(this.componentTransition).create(
            propV1,
            propV2,
            [...(this.basePathA ?? []), keyV1],
            [...(this.basePathB ?? []), keyV2]);
        return [propDiff.similarity, propDiff];
    }
}