import { ComponentPropertyValue, ComponentPropertyArray, ComponentPropertyPrimitive, ComponentPropertyRecord, EmptyComponentProperty } from "../../../infra-model";
import { JSONSerializable, Serialized } from "../../json-serializable";
import { SerializationID } from "../../json-serializer";
import { SerializedComponentPropertyArray, SerializedComponentPropertyPrimitive, SerializedComponentPropertyRecord } from "../../serialized-interfaces/infra-model/serialized-component-property";

export function componentPropertyArrayDeserializer(obj: Serialized, deserialize: (obj: SerializationID) => JSONSerializable): JSONSerializable {
    const serializedComponentProperty = obj as SerializedComponentPropertyArray;

    return new ComponentPropertyArray(
        serializedComponentProperty.value.map(v => deserialize(v) as ComponentPropertyValue),
        serializedComponentProperty.componentUpdateType
    );
}

export function componentPropertyRecordDeserializer(obj: Serialized, deserialize: (obj: SerializationID) => JSONSerializable): JSONSerializable {
    const serializedComponentProperty = obj as SerializedComponentPropertyRecord;

    return new ComponentPropertyRecord(
        Object.fromEntries(Object.entries(serializedComponentProperty.value).map(([k,v]) => [k, deserialize(v) as ComponentPropertyValue])),
        serializedComponentProperty.componentUpdateType
    );
}

export function componentPropertyPrimitiveDeserializer(obj: Serialized): JSONSerializable {
    const serializedComponentProperty = obj as SerializedComponentPropertyPrimitive;

    return new ComponentPropertyPrimitive(
        serializedComponentProperty.value,
        serializedComponentProperty.componentUpdateType
    );
}

export function componentPropertyEmptyDeserializer(): JSONSerializable {
    return new EmptyComponentProperty();
}