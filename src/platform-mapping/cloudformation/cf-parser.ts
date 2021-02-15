import { InfraModel } from '../../infra-model/infra-model'
import { Relationship } from '../../infra-model/relationship'
import { Parser } from '../parser'
import { CFEntity } from './cf-entity'
import { CFParameter } from './cf-parameter'
import { CFParserArgs } from './cf-parser-args'
import { CFResource } from './cf-resource'
import { CFNestedStack } from './cf-nested-stack'
import { CFOutput } from './cf-output'
import { Component } from '../../infra-model/component'


const cfEntityFactory = (componentType: string, componentName: string, definition: any, parserArgs: CFParserArgs, rootNode: Component) => {
    switch(componentType){
        case "Resources":
            switch(definition.Type){
                case "AWS::CloudFormation::Stack": return new CFNestedStack(componentName, definition, parserArgs, rootNode)
                default: return new CFResource(componentName, definition, parserArgs, rootNode)
            }
        case "Parameters":
            return new CFParameter(componentName, definition, parserArgs, rootNode)
        case "Outputs":
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

        const templateRoot = args?.templateRoot ?? new Component(this.name, 'root')

        const cfEntities = this.createCFEntities(templateRoot, args)

        return this.createModel(templateRoot, cfEntities)
    }

    createCFEntities = (rootNode: Component, args?: CFParserArgs):Record<string, CFEntity> => {
        const nodes: Record<string, CFEntity> = {}
        Object.entries(this.template).forEach(([componentType, definitions]) => {
            Object.entries(definitions).forEach(([componentName, definition]) => {

                const node = cfEntityFactory(componentType, componentName, definition, args ?? {}, rootNode)
                node && (nodes[componentName] = node)

            })
        })
        return nodes
    }

    createModel = (templateRoot:Component, cfEntities: Record<string, CFEntity>, externalParameters?: Record<string, CFEntity[]>):InfraModel => {
        const relationships: Relationship[] = []
        const components: Component[] = []
        Object.values(cfEntities).forEach(node => {
            const [r, c] = node.createRelationshipsAndComponents(cfEntities, externalParameters)
            relationships.push(...r)
            components.push(...c)
        })

        return new InfraModel(
            templateRoot,
            [templateRoot, ...components],
            [...relationships]
        )
    }
}
