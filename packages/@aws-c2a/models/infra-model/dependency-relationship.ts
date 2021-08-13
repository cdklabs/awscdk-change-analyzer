import { JSONSerializable } from '../export/json-serializable';
import { SerializationID } from '../export/json-serializer';
import { SerializationClasses } from '../export/serialization-classes';
import { SerializedDependencyRelationship } from '../export/serialized-interfaces/infra-model/serialized-relationship';
import { Component } from './component';
import { PropertyPath } from './component-property';
import { Relationship, RelationshipData } from './relationship';

export type DependencyRelationshipOptions = {
  readonly sourcePropertyPath?: PropertyPath
  readonly targetAttributePath?: PropertyPath
}

interface DependencyRelationshipData extends RelationshipData, DependencyRelationshipOptions {}

/**
 * DependencyRelationship describes whether changes in the target component
 * impact the source component, and how.
 */
export class DependencyRelationship extends Relationship<DependencyRelationshipData> {

  public get sourcePropertyPath(): PropertyPath { return this.nodeData.sourcePropertyPath ?? []; }
  public get targetAttributePath(): PropertyPath { return this.nodeData.targetAttributePath ?? []; }

  constructor(source: Component, target: Component, type: string, options?: DependencyRelationshipOptions){
    super(source, target, {type, ...options});
  }

  public toSerialized(serialize: (obj: JSONSerializable) => SerializationID): SerializedDependencyRelationship {
    return {
      ...super.toSerialized(serialize),
      sourcePropertyPath: this.sourcePropertyPath,
      targetAttributePath: this.targetAttributePath,
    };
  }

  public getSerializationClass(): string{
    return SerializationClasses.DEPENDENCY_RELATIONSHIP;
  }

}