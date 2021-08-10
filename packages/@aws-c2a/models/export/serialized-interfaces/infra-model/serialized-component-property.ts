import { ComponentUpdateType, PropertyPrimitive } from "../../../infra-model";
import { SerializedRecord } from "../../json-serializable";
import { SerializationID } from "../../json-serializer";

export interface SerializedComponentProperty extends SerializedRecord {
    value: PropertyPrimitive | SerializationID[] | Record<string, SerializationID> | undefined,
    componentUpdateType: ComponentUpdateType
}

export interface SerializedComponentPropertyRecord extends SerializedComponentProperty {
    value: Record<string, SerializationID>
}

export interface SerializedComponentPropertyArray extends SerializedComponentProperty {
    value: SerializationID[]
}

export interface SerializedComponentPropertyPrimitive extends SerializedComponentProperty {
    value: PropertyPrimitive
}

export interface SerializedComponentPropertyEmpty extends SerializedComponentProperty {
    value: undefined
}