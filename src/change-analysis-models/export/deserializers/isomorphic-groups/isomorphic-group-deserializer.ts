import { IsomorphicGroup } from "../../../isomorphic-groups";
import { JSONSerializable, Serialized } from "../../json-serializable";
import { SerializationID } from "../../json-serializer";
import { SerializedIsomorphicGroup } from "../../serialized-interfaces/isomorphic-groups/serialized-isomorphic-group";

export function isomorphicGroupDeserializer<T extends JSONSerializable>(obj: Serialized, deserialize: (obj: SerializationID) => JSONSerializable): IsomorphicGroup<T> {
    const serialized = obj as SerializedIsomorphicGroup;

    return {
        entities: new Set(serialized.entities.map(deserialize) as T[]),
        characteristics: serialized.characteristics
    };
}
