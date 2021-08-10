import { Component, DependencyRelationship } from "../../../infra-model";
import { JSONSerializable, Serialized } from "../../json-serializable";
import { SerializationID } from "../../json-serializer";
import { SerializedDependencyRelationship } from "../../serialized-interfaces/infra-model/serialized-relationship";

export function dependencyRelationshipDeserializer(obj: Serialized, deserialize: (obj: SerializationID) => JSONSerializable): JSONSerializable {
    const serializedDependencyRelationship = obj as SerializedDependencyRelationship;

    const target = deserialize(serializedDependencyRelationship.target) as Component;
    const source = deserialize(serializedDependencyRelationship.source) as Component;

    const relationship = new DependencyRelationship(
        source,
        target,
        serializedDependencyRelationship.type,
        {
            targetAttributePath: serializedDependencyRelationship.targetAttributePath,
            sourcePropertyPath: serializedDependencyRelationship.sourcePropertyPath
        }
    );

    source.addOutgoing(relationship);

    return relationship;
}