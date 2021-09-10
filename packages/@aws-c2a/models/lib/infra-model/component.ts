import { JSONSerializable } from '../export/json-serializable';
import { SerializationID } from '../export/json-serializer';
import { SerializationClasses } from '../export/serialization-classes';
import { SerializedComponent } from '../export/serialized-interfaces/infra-model/serialized-component';
import { ComponentPropertyValue, EmptyComponentProperty } from './component-property';
import { ModelEntity } from './model-entity';
import { ModelEntityTypes } from './model-entity-types';
import { Relationship } from './relationship';

type NodeData = {
  readonly type: string;
  readonly subtype?: string;
  readonly name: string;
}

type OutgoingNodeReferences = {
  readonly hasRelationship: Set<Relationship>;
  readonly hasProperties: ComponentPropertyValue;
}

interface ComponentOptions {
  readonly subtype?: string;
  readonly properties: ComponentPropertyValue;
}

/**
 * Component is any element of the infrastructure definition
 *
 * Examples include resources, resource groups, sets of configurations, variables,
 * or any other entity that influences the infrastructure deployment or the user's
 * perception of it in any way.
 */
export class Component extends ModelEntity<NodeData, OutgoingNodeReferences> implements JSONSerializable {

  get outgoing(): Set<Relationship>{ return this.outgoingNodeReferences.hasRelationship; }
  public incoming: Set<Relationship> = new Set();

  get properties(): ComponentPropertyValue { return this.outgoingNodeReferences.hasProperties; }

  /**
     * properties hold any values that should be tracked
     * by the change analysis but do not have any other relevant behaviors
     */
  public get type(): string { return this.nodeData.type; }
  public get subtype(): string | undefined { return this.nodeData.subtype; }
  public get name(): string { return this.nodeData.name; }

  constructor(name: string, type: string, options? : ComponentOptions){
    super(
      ModelEntityTypes.component,
      {
        name,
        type,
        subtype: options?.subtype,
      }, {
        hasRelationship: new Set(),
        hasProperties: options?.properties ?? new EmptyComponentProperty(),
      },
    );
  }

  public addOutgoing(relationship: Relationship): void{
    if(relationship.source !== this)
      throw Error('Trying to add relationship that does not belong to component');
    this.outgoing.add(relationship);
    relationship.target.incoming.add(relationship);
  }

  public addIncoming(relationship: Relationship): void {
    if(relationship.target !== this)
      throw Error('Trying to add relationship that does not belong to component');

    relationship.source.addOutgoing(relationship);
  }

  public removeOutgoing(relationship: Relationship): void{
    if(relationship.source !== this)
      throw Error('Trying to remove relationship that does not belong to component');
    this.outgoing.delete(relationship);
    relationship.target.incoming.delete(relationship);
  }

  public removeIncoming(relationship: Relationship): void {
    if(relationship.target !== this)
      throw Error('Trying to remove relationship that does not belong to component');

    relationship.source.removeOutgoing(relationship);
  }

  public toSerialized(serialize: (obj: JSONSerializable) => SerializationID): SerializedComponent {
    return {
      properties: serialize(this.properties),
      type: this.type,
      subtype: this.subtype,
      name: this.name,
    };
  }

  public getSerializationClass(): string{
    return SerializationClasses.COMPONENT;
  }
}
