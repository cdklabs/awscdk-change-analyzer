import { JSONSerializable } from '../export/json-serializable';
import { SerializationID } from '../export/json-serializer';
import { SerializationClasses } from '../export/serialization-classes';
import { SerializedInfraModel } from '../export/serialized-interfaces/infra-model/serialized-infra-model';
import { Component } from './component';
import { ModelEntity } from './model-entity';
import { ModelEntityTypes } from './model-entity-types';
import { Relationship } from './relationship';

type OutgoingNodeReferences = {
  components: Component[],
  relationships: Relationship[],
}

export class InfraModel extends ModelEntity<any, OutgoingNodeReferences> implements JSONSerializable {

  public get components(): Component[] { return this.outgoingNodeReferences.components; }
  public get relationships(): Relationship[] { return this.outgoingNodeReferences.relationships; }

  constructor(components: Component[], relationships: Relationship[]){
    super(ModelEntityTypes.infrastructureState, {}, {components, relationships});
  }

  public toSerialized(serialize: (obj: JSONSerializable) => SerializationID): SerializedInfraModel {
    return {
      components: this.components.map(c => serialize(c)),
      relationships: this.relationships.map(r => serialize(r)),
    };
  }

  public getSerializationClass(): string{
    return SerializationClasses.INFRA_MODEL;
  }
}