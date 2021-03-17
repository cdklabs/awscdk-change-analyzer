import { JSONSerializable, Serialized } from "../export/json-serializable";
import { SerializationClasses } from "../export/serialization-classes";
import { SerializedIsomorphicGroup } from "../export/serialized-interfaces/isomorphic-groups/serialized-isomorphic-group";

export type IGCharacteristicValue =  string | number | boolean | undefined;

export interface IsomorphicGroup<T> {
    entities: Set<T>,
    characteristics: Record<string, IGCharacteristicValue>,
    subGroups?: IsomorphicGroup<T>[]
}


export const isomorphicGroupSerializer = <T extends JSONSerializable>(
    ig: IsomorphicGroup<T>,
    serialize: (obj: JSONSerializable) => number,
    serializeCustom: (obj: any, serializationClass: string, serialized: Serialized) => number
): SerializedIsomorphicGroup => {
    return {
        entities: [...ig.entities].map(e => serialize(e)),
        characteristics: ig.characteristics,
        subGroups: ig.subGroups?.map(sg => serializeCustom(
            sg, SerializationClasses.ISOMORPHIC_GROUP, isomorphicGroupSerializer(sg, serialize, serializeCustom)
        )),
    };
};