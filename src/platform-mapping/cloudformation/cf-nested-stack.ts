import { Component } from '../../infra-model/component'
import { ComponentNode } from '../../infra-model/component-node'
import { Relationship } from '../../infra-model/relationship'
import { StructuralRelationship } from '../../infra-model/structural-relationship'
import { CFNode } from './cf-node'
import { CFParserArgs } from './cf-parser-args'
import { CFResource } from './cf-resource'
import { CFParser } from './cf-parser'

export class CFNestedStack extends CFResource {

    generateComponentNode(name: string, definition:Record<string, any>): Component {
        return new Component(name, 'resource', {subtype: definition.Type, properties: definition.Properties})
    }

    constructor(name: string, componentNode: Record<string, any>, args: CFParserArgs, rootNode: ComponentNode){
        super(name, componentNode, args, rootNode)
        this.dependencyRefs = new Map(Object.entries(CFNode.readRefsInExpression(componentNode)).filter(([type]) => !type.startsWith("Properties.Parameters")))
    }

    createRelationshipsAndComponentNodes(nodes: Record<string, CFNode>): [Relationship[], ComponentNode[]] {
        const [outerRelationships, outerComponentNodes] = super.createRelationshipsAndComponentNodes(nodes)

        const nestedStackName = this.component.name
        if(!this.parserArgs.nestedStacks || !{}.hasOwnProperty.call(this.parserArgs.nestedStacks, nestedStackName))
            throw Error(`Cannot evaluate nested stack '${nestedStackName}'. Its template was not provided`)
        
        const innerStack = this.parserArgs.nestedStacks[nestedStackName]
        const parameters = Object.entries(this.component.properties.Parameters ?? {})
        const model = new CFParser(innerStack, nestedStackName).parse(
            { 
                parameterComponents: Object.fromEntries(parameters.map(([innerParameterName, innerParameterVal]) =>
                    [innerParameterName, Object.values(CFNode.readRefsInExpression(innerParameterVal)).map(ref => nodes[ref].component)])
                )
            }
        )

        const innerRelationships: Relationship[] = (model.componentNodes
                .filter(c => c instanceof Component) as Component[])
                .map((c:Component) => this.createDependencyRelationship(c, 'nested-stack-component'))
                
        const rootRelationship = new StructuralRelationship(this.rootNode, model.rootNode, 'nestedStack')
        this.rootNode.children.add(rootRelationship)
        model.rootNode.parents.add(rootRelationship)

        const relationships = [...outerRelationships, ...innerRelationships, ...model.relationships, rootRelationship]
        const componentNodes = [...outerComponentNodes, ...model.componentNodes]

        return [relationships, componentNodes]
    }

}