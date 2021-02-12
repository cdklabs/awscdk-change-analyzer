import { Component } from '../../infra-model/component'
import { ComponentNode } from '../../infra-model/component-node'
import { CFNode } from './cf-node'
import { CFParserArgs } from './cf-parser-args'

export class CFResource extends CFNode {

    constructor(name: string, definition: Record<string, any>, args: CFParserArgs, rootNode: ComponentNode){
        super(name, definition, args, rootNode)
        if(definition.Properties && typeof definition.Properties.DependsOn === 'string')
            this.dependencyRefs.set('DependsOn', definition.Properties.DependsOn)
    }

    generateComponentNode(name: string, definition:Record<string, any>): Component {
        return new Component(name, 'resource', {subtype: definition.Type, properties: definition.Properties})
    }

}