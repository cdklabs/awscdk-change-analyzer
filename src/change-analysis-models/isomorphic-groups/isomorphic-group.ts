import { JSONSerializable } from "../export/json-serializable";
import { SerializedIsomorphicGroup } from "../export/serialized-interfaces/isomorphic-groups/serialized-isomorphic-group";

export type IGCharacteristicValue =  string | number | boolean;

export interface IsomorphicGroup<T> {
    entities: Set<T>,
    characteristics: Record<string, IGCharacteristicValue>
}


export const isomorphicGroupSerializer = <T extends JSONSerializable>(ig: IsomorphicGroup<T>, serialize: (obj: JSONSerializable) => number): SerializedIsomorphicGroup => {
    return {
        entities: [...ig.entities].map(e => serialize(e)),
        characteristics: ig.characteristics
    };
};