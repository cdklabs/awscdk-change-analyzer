import { Component } from '../../infra-model/component'
import { Relationship } from '../../infra-model/relationship'
import { CFEntity } from './cf-entity'
import { CFParserArgs } from './cf-parser-args'
import { CFResource } from './cf-resource'
import { CFParser } from './cf-parser'

export class CFNestedStack extends CFResource {

    generateComponent(name: string, definition:Record<string, any>): Component {
        return new Component(name, 'resource', {subtype: definition.Type, properties: definition.Properties})
    }

    constructor(name: string, definition: Record<string, any>, args: CFParserArgs, templateRoot: Component){
        super(name, definition, args, templateRoot)
        this.dependencyRefs = this.dependencyRefs.filter(ref => ref.sourcePath[0] !== 'Properties' || ref.sourcePath[1] !== 'Parameters')
    }

    createRelationshipsAndComponents(nodes: Record<string, CFEntity>): [Relationship[], Component[]] {
        const [outerRelationships] = super.createRelationshipsAndComponents(nodes)

        const nestedStackName = this.component.name
        if(!this.parserArgs.nestedStacks || !{}.hasOwnProperty.call(this.parserArgs.nestedStacks, nestedStackName))
            throw Error(`Cannot evaluate nested stack '${nestedStackName}'. Its template was not provided`)
        
        const innerStack = this.parserArgs.nestedStacks[nestedStackName]
        const parameters = Object.entries(this.component.properties.Parameters ?? {})
        const model = new CFParser(innerStack, nestedStackName).parse(
            { 
                templateRoot: this.component,
                parameterComponents: Object.fromEntries(parameters.map(([innerParameterName, innerParameterVal]) =>
                    [innerParameterName, Object.values(CFEntity.readRefsInExpression(innerParameterVal)).map(ref => nodes[ref.logicalId].component)])
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