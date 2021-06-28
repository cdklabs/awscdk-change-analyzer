import { Serialized, SerializedRecord } from "../../json-serializable";
import { SerializationID } from "../../json-serializer";

export interface SerializedTransition extends SerializedRecord {
    v1?: SerializationID | {value: Serialized },
    v2?: SerializationID | {value: Serialized },
}