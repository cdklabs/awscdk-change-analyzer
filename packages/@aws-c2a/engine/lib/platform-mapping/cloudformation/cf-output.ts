import { Component } from '@aws-c2a/models';
import { CFEntity } from './cf-entity';

export class CFOutput extends CFEntity {

  protected generateComponent(name: string, definition: Record<string, any>): Component {
    return new Component(name, 'Output', {subtype: definition.Type, properties: this.cfDefinitionToComponentProperty(definition)});
  }
}