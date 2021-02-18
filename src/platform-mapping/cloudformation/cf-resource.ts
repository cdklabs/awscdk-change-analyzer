import { Component } from '../../infra-model';
import { CFEntity } from './cf-entity';
import { CFParserArgs } from './cf-parser-args';
import { CFRef } from './cf-ref';

export class CFResource extends CFEntity {

    constructor(name: string, definition: Record<string, any>, args: CFParserArgs){
        super(name, definition, args);
        if(definition.Properties && typeof definition.Properties.DependsOn === 'string')
            this.dependencyRefs.push(new CFRef(['DependsOn'], definition.Properties.DependsOn, 'Properties.DependsOn'));
    }

    protected generateComponent(name: string, definition:Record<string, any>): Component {
        return new Component(name, 'resource', {subtype: definition.Type, properties: definition.Properties ?? {}});
    }

}