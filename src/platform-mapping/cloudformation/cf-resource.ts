import { Component } from '../../infra-model/component'
import { CFEntity } from './cf-entity'
import { CFParserArgs } from './cf-parser-args'
import { CFRef } from './cf-ref'

export class CFResource extends CFEntity {

    constructor(name: string, definition: Record<string, any>, args: CFParserArgs, rootNode: Component){
        super(name, definition, args, rootNode)
        if(definition.Properties && typeof definition.Properties.DependsOn === 'string')
            this.dependencyRefs.push(new CFRef(['DependsOn'], definition.Properties.DependsOn, 'Properties.DependsOn'))
    }

    generateComponent(name: string, definition:Record<string, any>): Component {
        return new Component(name, 'resource', {subtype: definition.Type, properties: definition.Properties})
    }

}