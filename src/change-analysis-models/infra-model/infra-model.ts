import { JSONSerializable, Serialized } from "../export/json-serializable";
import { SerializationID } from "../export/json-serializer";
import { SerializationClasses } from "../export/serialization-classes";
import { SerializedInfraModel } from "../export/serialized-interfaces/infra-model/serialized-infra-model";
import { Component } from "./component";
import { Relationship } from "./relationship";

export class InfraModel implements JSONSerializable {
    public readonly components: Component[];
    public readonly relationships: Relationship[];

    constructor(components: Component[], relationships: Relationship[]){
        this.components = components;
        this.relationships = relationships;
    }

    public toSerialized(serialize: (obj: JSONSerializable) => SerializationID): SerializedInfraModel {
        return {
            components: this.components.map(c => serialize(c)),
            relationships: this.relationships.map(r => serialize(r))
        };
    }

    public getSerializationClass(): string{
        return SerializationClasses.INFRA_MODEL;
    }
}