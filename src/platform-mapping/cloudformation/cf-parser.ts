import { InfraModel } from '../../infra-model/infra-model'
import { Relationship } from '../../infra-model/relationship'
import { Parser } from '../parser'
import { CFNode } from './cf-node'
import { CFParameter } from './cf-parameter'
import { CFParserArgs } from './cf-parser-args'
import { CFResource } from './cf-resource'
import { CFNestedStack } from './cf-nested-stack'
import { CFOutput } from './cf-output'
import { Component } from '../../infra-model/component'


const cfNodeFactory = (componentType: string, componentName: string, definition: any, parserArgs: CFParserArgs, rootNode: Component) => {
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

        const rootComponent = args?.rootComponent ?? new Component(this.name, 'root')

        const cfNodes = this.createCFNodes(rootComponent, args)

        const relationships: Relationship[] = []
        const components: Component[] = []
        Object.values(cfNodes).forEach(node => {
            const [r, c] = node.createRelationshipsAndComponents(cfNodes)
            relationships.push(...r)
            components.push(...c)
        })

        return new InfraModel(
            rootComponent,
            [rootComponent, ...components],
            [...relationships]
        )
    }

    createCFNodes = (rootNode: Component, args?: CFParserArgs):Record<string, CFNode> => {
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
