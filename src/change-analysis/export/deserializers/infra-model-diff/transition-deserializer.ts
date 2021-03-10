import { Transition } from "../../../model-diffing/transition";
import { JSONSerializable, Serialized } from "../../json-serializable";
import { SerializationID } from "../../json-serializer";
import { SerializedTransition } from "../../serialized-interfaces/infra-model-diff/serialized-transition";

export function transitionDeserializer<T extends JSONSerializable>(obj: Serialized, deserialize: (obj: SerializationID) => JSONSerializable): Transition<T> {
    const serialized = obj as SerializedTransition;

    return {
        v1: serialized.v1 ? deserialize(serialized.v1) as T : undefined,
        v2: serialized.v2 ? deserialize(serialized.v2) as T : undefined,
    };
}
