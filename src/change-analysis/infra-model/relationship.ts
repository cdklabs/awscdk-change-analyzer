import { JSONSerializable } from "../export/json-serializable";
import { SerializationID } from "../export/json-serializer";
import { SerializedRelationship } from "../export/serialized-interfaces/infra-model/serialized-relationship";
import { Component } from "./component";

/**
 * Relationships connect two components and
 * describe how they relate to each other
 */
export abstract class Relationship implements JSONSerializable {

    public readonly source: Component;
    public readonly target: Component;

    public readonly type: string;

    constructor(source: Component, target: Component, type: string){
        this.source = source;
        this.target = target;
        this.type = type;
    }

    public toSerialized(serialize: (obj: JSONSerializable) => SerializationID): SerializedRelationship {
        return {
            target: serialize(this.target),
            source: serialize(this.source),
            type: this.type,
        };
    }

    public abstract getSerializationClass(): string;
}