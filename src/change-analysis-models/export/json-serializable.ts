import { SerializationID } from "./json-serializer";

type SerializablePrimitive = string | number | boolean | undefined | null;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface SerializedArray extends Array<Serialized> { }
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SerializedRecord extends Record<number | string, Serialized> { }
type SerializedCollection = SerializedArray | SerializedRecord;

export type Serialized = SerializablePrimitive | SerializedCollection;

export interface JSONSerializable {
    /**
     * This method converts an object into a serializable object.
     * Offers a callback to serialize its references.
     * @param serializer Serializes a JSONSerializable inner instance and returns its serialized id
     * @returns the serialized object
     */
    toSerialized(serialize: (obj: JSONSerializable) => SerializationID, serializeCustom: (obj: any, serializationClass: string, serialized: Serialized) => SerializationID): Serialized;

    getSerializationClass(): string;
}

export function isJSONSerializable(o: any): o is JSONSerializable {
    return typeof o.toSerialized === 'function'
        && typeof o.getSerializationClass === 'function'
        && typeof o.getSerializationClass() === 'string'; 
}