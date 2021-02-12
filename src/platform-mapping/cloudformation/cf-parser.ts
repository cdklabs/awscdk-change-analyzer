import { ComponentGroup } from '../../infra-model/component-group'
import { ComponentNode } from '../../infra-model/component-node'
import { InfraModel } from '../../infra-model/infra-model'
import { Relationship } from '../../infra-model/relationship'
import { Parser } from '../parser'
import { CFNode } from './cf-node'
import { CFParameter } from './cf-parameter'
import { CFParserArgs } from './cf-parser-args'
import { CFResource } from './cf-resource'
import { CFNestedStack } from './cf-nested-stack'
import { CFOutput } from './cf-output'


const cfNodeFactory = (componentType: string, componentName: string, definition: any, parserArgs: CFParserArgs, rootNode: ComponentNode) => {
    switch(componentType){
        case "Resources":
            switch(definition.Type){
                case "AWS::CloudFormation::Stack": return new CFNestedStack(componentName, definition, parserArgs, rootNode)
                default: return new CFResource(componentName, definition, parserArgs, rootNode)
            }
        case "Parameters":
            return new CFParameter(componentName, definition, parserArgs, rootNode)
        case "Output":
            return new CFOutput(componentName, definition, parserArgs, rootNode)
        default: return undefined
    }
}

export class CFParser implements Parser {

    template: Record<any, any>
    name: string

    constructor(template: Record<any, any>, name?: string) {
        this.template = template
        this.name = name ?? 'root'
    }

    parse = (args?: CFParserArgs): InfraModel => {

        const rootNode = new ComponentGroup(this.name)

        const cfNodes = this.createCFNodes(rootNode, args)

        const relationships: Relationship[] = []
        const componentNodes: ComponentNode[] = []
        Object.values(cfNodes).forEach(node => {
            const [r, c] = node.createRelationshipsAndComponentNodes(cfNodes)
            relationships.push(...r)
            componentNodes.push(...c)
        })

        return new InfraModel(
            rootNode,
            [rootNode, ...componentNodes],
            [...relationships]
        )
    }

    createCFNodes = (rootNode: ComponentNode, args?: CFParserArgs):Record<string, CFNode> => {
        const nodes: Record<string, CFNode> = {}
        Object.entries(this.template).forEach(([componentType, definitions]) => {
            Object.entries(definitions).forEach(([componentName, definition]) => {

                const node = cfNodeFactory(componentType, componentName, definition, args ?? {}, rootNode)
                node && (nodes[componentName] = node)

            })
        })
        return nodes
    }
}
