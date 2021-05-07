import { PropertyPath } from "../../../infra-model";
import { SerializedRecord } from "../../json-serializable";
import { SerializationID } from "../../json-serializer";

export interface SerializedRelationship extends SerializedRecord {
    readonly target: SerializationID,
    readonly source: SerializationID,
    readonly type: string,
}

export interface SerializedDependencyRelationship extends SerializedRelationship {
    readonly sourcePropertyPath: PropertyPath,
    readonly targetAttributePath: PropertyPath
}