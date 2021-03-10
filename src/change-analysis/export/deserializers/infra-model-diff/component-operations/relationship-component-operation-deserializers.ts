import { Component, Relationship } from "../../../../infra-model";
import { InsertOutgoingRelationshipComponentOperation, RemoveOutgoingRelationshipComponentOperation, UpdateOutgoingRelationshipComponentOperation } from "../../../../model-diffing";
import { Transition } from "../../../../model-diffing/transition";
import { JSONSerializable, Serialized } from "../../../json-serializable";
import { SerializationID } from "../../../json-serializer";
import { SerializedOutgoingRelationshipComponentOperation } from "../../../serialized-interfaces/infra-model-diff/serialized-component-operation";
import { deserializeComponentOperationOptions } from "./utils";

export function insertOutgoingRelationshipComponentOperationDeserializer(obj: Serialized, deserialize: (obj: SerializationID) => JSONSerializable): JSONSerializable {
    const serialized = obj as SerializedOutgoingRelationshipComponentOperation;

    const componentTransition = deserialize(serialized.componentTransition) as Transition<Component>;
    if(!componentTransition.v1 || !componentTransition.v2)
        throw Error("'Insert Outgoing Relationship' Component Operation does not have both Components");

    const relationshipTransition = deserialize(serialized.relationshipTransition) as Transition<Relationship>;
    if(!relationshipTransition.v2)
        throw Error("'Insert Outgoing Relationship' Component Operation does not have new Relationship");

    const options = deserializeComponentOperationOptions(serialized, deserialize);

    return new InsertOutgoingRelationshipComponentOperation(componentTransition, relationshipTransition.v2, options);
}

export function removeOutgoingRelationshipComponentOperationDeserializer(obj: Serialized, deserialize: (obj: SerializationID) => JSONSerializable): JSONSerializable {
    const serialized = obj as SerializedOutgoingRelationshipComponentOperation;

    const componentTransition = deserialize(serialized.componentTransition) as Transition<Component>;
    if(!componentTransition.v1 || !componentTransition.v2)
        throw Error("'Remove Outgoing Relationship' Component Operation does not have both Components");

    const relationshipTransition = deserialize(serialized.relationshipTransition) as Transition<Relationship>;
    if(!relationshipTransition.v1)
        throw Error("'Remove Outgoing Relationship' Component Operation does not have new Relationship");

    const options = deserializeComponentOperationOptions(serialized, deserialize);

    return new RemoveOutgoingRelationshipComponentOperation(componentTransition, relationshipTransition.v1, options);
}

export function updateOutgoingRelationshipComponentOperationDeserializer(obj: Serialized, deserialize: (obj: SerializationID) => JSONSerializable): JSONSerializable {
    const serialized = obj as SerializedOutgoingRelationshipComponentOperation;

    const componentTransition = deserialize(serialized.componentTransition) as Transition<Component>;
    if(!componentTransition.v1 || !componentTransition.v2)
        throw Error("'Update Outgoing Relationship' Component Operation does not have both Components");

    const relationshipTransition = deserialize(serialized.relationshipTransition) as Transition<Relationship>;
    if(!componentTransition.v1 || !componentTransition.v2)
        throw Error("'Update Outgoing Relationship' Component Operation does not have new Relationship");

    const options = deserializeComponentOperationOptions(serialized, deserialize);

    return new UpdateOutgoingRelationshipComponentOperation(componentTransition, relationshipTransition, options);
}