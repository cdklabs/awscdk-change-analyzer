import { ModelEntityTypes } from '@aws-c2a/models';
import { Bindable } from '.';

export enum ComponentType {
  RESOURCE = 'Resource',
  PARAMETER = 'Parameter',
  OUTPUT = 'Output',
}

export class Component extends Bindable {
  public static fromResource(id: string, subtype: string) {
    return new Component(id, ComponentType.RESOURCE, subtype);
  }

  public readonly type: ComponentType;
  public readonly subtype: string;

  constructor(id: string, type: ComponentType, subtype: string) {
    super(id, ModelEntityTypes.component);
    this.type = type;
    this.subtype = subtype;
  }
}