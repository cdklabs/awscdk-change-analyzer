import { PropertyPath } from "../../../infra-model";
import { SerializedRecord } from "../../json-serializable";
import { SerializationID } from "../../json-serializer";

export interface SerializedComponentOperation extends SerializedRecord {
    cause?: SerializationID,
    certainty: string,
    componentTransition: SerializationID
}

export interface SerializedOutgoingRelationshipComponentOperation extends SerializedComponentOperation {
    relationshipTransition: SerializationID
}

export interface SerializedPropertyComponentOperation extends SerializedComponentOperation {
    pathTransition: {v1?: PropertyPath, v2?: PropertyPath},
    propertyTransition: SerializationID
}

export interface SerializedUpdatePropertyComponentOperation extends SerializedPropertyComponentOperation {
    innerOperations?: SerializationID[]
}