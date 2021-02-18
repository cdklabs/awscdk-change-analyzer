import { Component } from '../../infra-model';
import { CFEntity } from './cf-entity';
import { CFParserArgs } from './cf-parser-args';

export class CFResource extends CFEntity {

    constructor(name: string, definition: Record<string, any>, args: CFParserArgs){
        super(name, definition, args);
    }

    protected generateComponent(name: string, definition:Record<string, any>): Component {
        return new Component(name, 'resource', {subtype: definition.Type, properties: definition});
    }

}