import { SerializedRecord } from "../../json-serializable";
import { SerializationID } from "../../json-serializer";

export interface SerializedTransition extends SerializedRecord {
    v1?: SerializationID,
    v2?: SerializationID,
}