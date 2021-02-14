import { Component } from "../../infra-model/component"
import { Relationship } from "../../infra-model/relationship"
import { CFEntity } from "./cf-entity"

export class CFParameter extends CFEntity {

    generateComponent(name: string, definition: Record<string, any>): Component {
        const component = new Component(name, 'parameter', {subtype: definition.Type, properties: definition})

        if(this.parserArgs.parameterValues && this.parserArgs.parameterValues[name] !== undefined){
            component.properties.parameter_value = this.parserArgs.parameterValues[name]
        }

        return component
    }

    createRelationshipsAndComponents(nodes: Record<string, CFEntity>): [Relationship[], Component[]]{
        const [outerRelationships, componentNodes] = super.createRelationshipsAndComponents(nodes)

        const argParameterRelationships = 
            (this.parserArgs.parameterComponents && (this.parserArgs.parameterComponents)[this.component.name])
            ? this.parserArgs.parameterComponents[this.component.name].map(c => this.createDependencyRelationship(c, 'nested-parameter'))
            : []

        return [[...outerRelationships, ...argParameterRelationships], componentNodes]
    }

}