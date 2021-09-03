import { ModelEntityTypes } from '@aws-c2a/models';
import { CSelector } from '../primitives';

export interface IBindable {
  id: string;
  [key: string]: any;

  generateBinding(): CSelector;
}

export abstract class Bindable implements IBindable {
  public readonly id: string;
  private readonly _type: ModelEntityTypes;

  constructor(id: string, type: ModelEntityTypes) {
    this.id = id;
    this._type = type;
  }

  public generateBinding(): CSelector {
    const cast = this as IBindable;
    const binding = Object.getOwnPropertyNames(cast).reduce((bindings, property) => ({
      ...bindings,
      ...(cast[property] && property !== 'id' && property !== '_type'
        ? { [property]: cast[property] }
        : {}
      ),
    }), {});
    return { [this._type]: binding };
  }
}