import { Component } from '../../infra-model/component'
import { Relationship } from '../../infra-model/relationship'
import { CFNode } from './cf-node'
import { CFParserArgs } from './cf-parser-args'
import { CFResource } from './cf-resource'
import { CFParser } from './cf-parser'

export class CFNestedStack extends CFResource {

    generateComponent(name: string, definition:Record<string, any>): Component {
        return new Component(name, 'resource', {subtype: definition.Type, properties: definition.Properties})
    }

    constructor(name: string, definition: Record<string, any>, args: CFParserArgs, rootComponent: Component){
        super(name, definition, args, rootComponent)
        this.dependencyRefs = new Map(Object.entries(CFNode.readRefsInExpression(definition)).filter(([type]) => !type.startsWith("Properties.Parameters")))
    }

    createRelationshipsAndComponents(nodes: Record<string, CFNode>): [Relationship[], Component[]] {
        const [outerRelationships] = super.createRelationshipsAndComponents(nodes)

        const nestedStackName = this.component.name
        if(!this.parserArgs.nestedStacks || !{}.hasOwnProperty.call(this.parserArgs.nestedStacks, nestedStackName))
            throw Error(`Cannot evaluate nested stack '${nestedStackName}'. Its template was not provided`)
        
        const innerStack = this.parserArgs.nestedStacks[nestedStackName]
        const parameters = Object.entries(this.component.properties.Parameters ?? {})
        const model = new CFParser(innerStack, nestedStackName).parse(
            { 
                rootComponent: this.component,
                parameterComponents: Object.fromEntries(parameters.map(([innerParameterName, innerParameterVal]) =>
                    [innerParameterName, Object.values(CFNode.readRefsInExpression(innerParameterVal)).flatMap(refs => refs.map(ref => nodes[ref].component))])
                )
            }
        )

        const crossRelationships: Relationship[] = (model.components
                .filter(c => c instanceof Component) as Component[])
                .map((c:Component) => this.createDependencyRelationship(c, 'nested-stack-component'))

        const relationships = [...outerRelationships, ...crossRelationships, ...model.relationships]
        const components = [...model.components]

        return [relationships, components]
    }

}