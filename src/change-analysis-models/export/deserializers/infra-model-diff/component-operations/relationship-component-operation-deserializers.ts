import {
    InsertOutgoingRelationshipComponentOperation,
    RemoveOutgoingRelationshipComponentOperation,
    UpdateOutgoingRelationshipComponentOperation,
} from "../../../../model-diffing/";
import {  } from "../../../../model-diffing/";
import { JSONSerializable, Serialized } from "../../../json-serializable";
import { SerializationID } from "../../../json-serializer";
import { SerializedOutgoingRelationshipComponentOperation } from "../../../serialized-interfaces/infra-model-diff/serialized-component-operation";
import { deserializeOpNodeData, deserializeRelationshipOpOutoingNodeReferences } from "./utils";

export function insertOutgoingRelationshipComponentOperationDeserializer(obj: Serialized, deserialize: (obj: SerializationID) => JSONSerializable): JSONSerializable {
    const serialized = obj as SerializedOutgoingRelationshipComponentOperation;

    return new InsertOutgoingRelationshipComponentOperation(
        deserializeOpNodeData(serialized),
        deserializeRelationshipOpOutoingNodeReferences(serialized, deserialize),
    );
}

export function removeOutgoingRelationshipComponentOperationDeserializer(obj: Serialized, deserialize: (obj: SerializationID) => JSONSerializable): JSONSerializable {
    const serialized = obj as SerializedOutgoingRelationshipComponentOperation;

    return new RemoveOutgoingRelationshipComponentOperation(
        deserializeOpNodeData(serialized),
        deserializeRelationshipOpOutoingNodeReferences(serialized, deserialize),
    );
}

export function updateOutgoingRelationshipComponentOperationDeserializer(obj: Serialized, deserialize: (obj: SerializationID) => JSONSerializable): JSONSerializable {
    const serialized = obj as SerializedOutgoingRelationshipComponentOperation;

    return new UpdateOutgoingRelationshipComponentOperation(
        deserializeOpNodeData(serialized),
        deserializeRelationshipOpOutoingNodeReferences(serialized, deserialize),
    );
}