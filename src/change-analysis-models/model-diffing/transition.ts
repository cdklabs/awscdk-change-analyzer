import { JSONSerializable } from "../export/json-serializable";
import { SerializationClasses } from "../export/serialization-classes";
import { SerializedTransition } from "../export/serialized-interfaces/infra-model-diff/serialized-transition";

/**
 * Represents two versions (v1 and v2) of an Entity
 */
export interface Transition<T> {
    v1?: T,
    v2?: T,
}

/**
 * Represents two versions (v1 and v2) of an Entity
 * where they both are defined
 */
export interface CompleteTransition<T> extends Transition<T> {
    v1: T,
    v2: T
}


export const transitionSerializer = <T extends JSONSerializable>(t: Transition<T>, serialize: (obj: JSONSerializable) => number): SerializedTransition => {
    return {
        v1: t.v1 ? serialize(t.v1) : undefined,
        v2: t.v2 ? serialize(t.v2) : undefined,
    };
};