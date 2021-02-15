import { Component } from '../../infra-model/component'
import { Relationship } from '../../infra-model/relationship'
import { CFEntity } from './cf-entity'
import { CFParserArgs } from './cf-parser-args'
import { CFResource } from './cf-resource'
import { CFParser } from './cf-parser'
import { CFOutput } from './cf-output'
import { CFRef } from './cf-ref'

export class CFNestedStack extends CFResource {

    innerCFEntities: Record<string, CFEntity>
    innerCFParser: CFParser

    generateComponent(name: string, definition:Record<string, any>): Component {
        return new Component(name, 'resource', {subtype: definition.Type, properties: definition.Properties})
    }

    constructor(name: string, definition: Record<string, any>, args: CFParserArgs, templateRoot: Component){
        super(name, definition, args, templateRoot)
        this.dependencyRefs = this.dependencyRefs.filter(ref => ref.sourcePath[0] !== 'Properties' || ref.sourcePath[1] !== 'Parameters')

        const nestedStackName = this.component.name
        if(!this.parserArgs.nestedStacks || !{}.hasOwnProperty.call(this.parserArgs.nestedStacks, nestedStackName))
            throw Error(`Cannot evaluate nested stack '${nestedStackName}'. Its template was not provided`)

        const innerStack = this.parserArgs.nestedStacks[nestedStackName]
        this.innerCFParser = new CFParser(innerStack, nestedStackName)
        this.innerCFEntities = this.innerCFParser.createCFEntities(this.component)
    }

    createRelationshipsAndComponents(nodes: Record<string, CFEntity>): [Relationship[], Component[]] {
        const [outerRelationships] = super.createRelationshipsAndComponents(nodes)        
        
        const parameters = Object.entries(this.component.properties.Parameters ?? {})

        const model = this.innerCFParser.createModel(this.component, this.innerCFEntities,
            Object.fromEntries(parameters.map(([innerParameterName, innerParameterVal]) =>
                [innerParameterName, CFRef.readRefsInExpression(innerParameterVal).map(ref => nodes[ref.logicalId])])
            )
        )

        const crossRelationships: Relationship[] = (model.components
                .filter(c => c instanceof Component && c !== this.component) as Component[])
                .map((c:Component) => this.createDependencyRelationship(c, 'nested-stack-component'))

        const relationships = [...outerRelationships, ...crossRelationships, ...model.relationships]
        const components = [...model.components]

        return [relationships, components]
    }

    getComponentInAttributePath = (attributePath:string[]):Component => {
        const innerEntity = attributePath.length >= 2
            && attributePath[0] === 'Outputs'
            && this.innerCFEntities[attributePath[1]]

        if(innerEntity instanceof CFOutput) return innerEntity.getComponentInAttributePath(attributePath.slice(2))
        return this.component
    } 

}