import { SerializedRecord } from "../../json-serializable";
import { SerializationID } from "../../json-serializer";

export interface SerializedInfraModel extends SerializedRecord {
    components: SerializationID[],
    relationships: SerializationID[],
} 