import { Component, ComponentProperty } from "../../../infra-model";
import { JSONSerializable, Serialized } from "../../json-serializable";
import { SerializationID } from "../../json-serializer";
import { SerializedComponent } from "../../serialized-interfaces/infra-model/serialized-component";

export function componentDeserializer(obj: Serialized, deserialize: (obj: SerializationID) => JSONSerializable): JSONSerializable {
    const serializedComponent: SerializedComponent = obj as SerializedComponent;

    const component = new Component(
        serializedComponent.name,
        serializedComponent.type,
        {
            subtype: serializedComponent?.subtype,
            properties: deserialize(serializedComponent.properties) as ComponentProperty
        }
    );

    return component;
}