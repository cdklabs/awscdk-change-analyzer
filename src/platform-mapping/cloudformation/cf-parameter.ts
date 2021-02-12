import { Component } from "../../infra-model/component"
import { ComponentNode } from "../../infra-model/component-node"
import { Relationship } from "../../infra-model/relationship"
import { CFNode } from "./cf-node"

export class CFParameter extends CFNode {

    generateComponentNode(name: string, definition: Record<string, any>): Component {
        const component = new Component(name, 'parameter', {subtype: definition.Type, properties: definition})

        if(this.parserArgs.parameterValues && this.parserArgs.parameterValues[name] !== undefined){
            component.properties.parameter_value = this.parserArgs.parameterValues[name]
        }

        return component
    }

    createRelationshipsAndComponentNodes(nodes: Record<string, CFNode>): [Relationship[], ComponentNode[]]{
        const [outerRelationships, componentNodes] = super.createRelationshipsAndComponentNodes(nodes)

        const argParameterRelationships = 
            (this.parserArgs.parameterComponents && (this.parserArgs.parameterComponents)[this.component.name])
            ? this.parserArgs.parameterComponents[this.component.name].map(c => this.createDependencyRelationship(c, 'nested-parameter'))
            : []

        return [[...outerRelationships, ...argParameterRelationships], componentNodes]
    }

}