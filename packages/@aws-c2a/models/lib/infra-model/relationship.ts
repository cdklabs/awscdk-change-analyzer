import { JSONSerializable } from '../export/json-serializable';
import { SerializationID } from '../export/json-serializer';
import { SerializedRelationship } from '../export/serialized-interfaces/infra-model/serialized-relationship';
import { Component } from './component';
import { ModelEntity } from './model-entity';
import { ModelEntityTypes } from './model-entity-types';

export enum RelationshipType {
  Dependency = 'dependency',
  Structural = 'structural'
}

export type RelationshipData = {
  readonly type: string;
  readonly relationshipType: RelationshipType;
}

export type RelationshipEdges = {
  readonly source: Component,
  readonly target: Component,
}

/**
 * Relationships connect two components and
 * describe how they relate to each other
 */
export abstract class Relationship<T extends RelationshipData = RelationshipData>
  extends ModelEntity<T, RelationshipEdges>
  implements JSONSerializable
{
  public get type(): string { return this.nodeData.type; }
  public get target(): Component { return this.outgoingNodeReferences.target; }
  public get source(): Component { return this.outgoingNodeReferences.source; }

  constructor(source: Component, target: Component, nodeData: T){
    super(ModelEntityTypes.relationship, nodeData, {source, target});
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