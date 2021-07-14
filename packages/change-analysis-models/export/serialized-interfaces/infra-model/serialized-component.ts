import { SerializedRecord } from "../../json-serializable";
import { SerializationID } from "../../json-serializer";

export interface SerializedComponent extends SerializedRecord {
    properties: SerializationID,
    type: string,
    subtype?: string,
    name: string,
    _id: string,
}