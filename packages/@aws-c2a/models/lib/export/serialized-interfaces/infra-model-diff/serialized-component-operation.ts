import { SerializedRecord } from '../../json-serializable';
import { SerializationID } from '../../json-serializer';

export interface SerializedComponentOperation extends SerializedRecord {
  cause?: SerializationID,
  certainty: string,
  componentTransition: SerializationID
}

export interface SerializedOutgoingRelationshipComponentOperation extends SerializedComponentOperation {
  relationshipTransition: SerializationID
}

export interface SerializedPropertyComponentOperation extends SerializedComponentOperation {
  pathTransition: SerializationID,
  propertyTransition: SerializationID
}

export interface SerializedUpdatePropertyComponentOperation extends SerializedPropertyComponentOperation {
  innerOperations?: SerializationID[]
}