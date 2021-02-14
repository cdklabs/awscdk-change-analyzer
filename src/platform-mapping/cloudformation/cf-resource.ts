import { Component } from '../../infra-model/component'
import { CFNode } from './cf-node'
import { CFParserArgs } from './cf-parser-args'

export class CFResource extends CFNode {

    constructor(name: string, definition: Record<string, any>, args: CFParserArgs, rootNode: Component){
        super(name, definition, args, rootNode)
        if(definition.Properties && typeof definition.Properties.DependsOn === 'string')
            this.dependencyRefs.set('DependsOn', [definition.Properties.DependsOn])
    }

    generateComponent(name: string, definition:Record<string, any>): Component {
        return new Component(name, 'resource', {subtype: definition.Type, properties: definition.Properties})
    }

}