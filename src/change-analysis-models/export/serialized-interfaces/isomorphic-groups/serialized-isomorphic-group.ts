import { IGCharacteristicValue } from "../../../isomorphic-groups";
import { SerializedRecord } from "../../json-serializable";
import { SerializationID } from "../../json-serializer";

export interface SerializedIsomorphicGroup extends SerializedRecord {
    readonly entities: SerializationID[],
    readonly characteristics: Record<string, IGCharacteristicValue>
}