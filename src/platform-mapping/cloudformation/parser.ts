import { Component } from '../../infra-model/component'
import { ComponentGroup } from '../../infra-model/component-group'
import { ComponentNode } from '../../infra-model/component-node'
import { DependencyRelationship } from '../../infra-model/dependency-relationship'
import { InfraModel } from '../../infra-model/infra-model'
import { Relationship } from '../../infra-model/relationship'
import { StructuralRelationship } from '../../infra-model/structural-relationship'
import { Parser } from '../parser'

interface CloudFormationParserArgs {
    parameterComponents?: Record<string, Component[]>
    parameterValues?: Record<string, string>
    importedValues?: Record<string, string>
    nestedStacks?: Record<string, Record<any, any>>
}

const readRefsInPropertyMapping: Record<string, (s:any) => string[]> = Object.freeze({
    'Ref': (value: any) =>
        (typeof(value) === 'string' && !value.startsWith('AWS::'))
        ? [value] : [],
    'Fn::GetAtt': (value: any) => 
        Array.isArray(value) ? [value[0]] : [],
})

const readRefsInExpression = (expression: any): string[] => 
    (typeof(expression) !== 'object' || expression == null)
    ? []
    : ([] as string[]).concat(
        ...Object.entries(expression).map(([k, v]) =>
            readRefsInPropertyMapping[k]
            ? readRefsInPropertyMapping[k](v)
            : readRefsInExpression(v)
        )
    )

export class CloudFormationParser implements Parser {

    template: Record<any, any>
    name: string
    componentNodes: Record<string, ComponentNode> = {}
    relationships: Array<Relationship> = []
    model: InfraModel
    nestedModels: InfraModel[] = []

    constructor(template: Record<any, any>, name?: string) {
        this.template = template
        this.name = name ?? 'root'
    }

    parse = (args?: CloudFormationParserArgs): InfraModel => {

        this.createComponents(args)

        Object.values(this.componentNodes).forEach(this.addDependencyRelationshipsFromComponent)

        Object.entries(args?.parameterComponents ?? {}).forEach(([name, componentRefs]) => {
            componentRefs.forEach(c => {
                const sourceComponent = this.componentNodes[name]
                if(sourceComponent instanceof Component){
                    this.addDependencyRelationship(sourceComponent, c, 'nested-parameter')
                }
            })
        })

        return this.buildFinalModel()
    }

    createComponents = (args?: CloudFormationParserArgs):void => {

        const nestedStacks: Record<string, any> = []

        this.template.Resources && Object.entries(this.template.Resources).forEach(
            ([name, r]:Array<any>) => {
                if(r.Type === 'AWS::CloudFormation::Stack'){
                    nestedStacks[name] = r
                } else {
                    this.componentNodes[name] = new Component(name, 'resource', {subtype: r.Type, properties: r.Properties})
                }
            }
        )
        
        this.template.Parameters && Object.entries(this.template.Parameters).forEach(([name, p]:Array<any>) => {
                const properties = p
                if(args?.parameterValues && args?.parameterValues[name] !== undefined){
                    properties.parameter_value = args?.parameterValues[name]
                }
                this.componentNodes[name] = new Component(name, 'parameter', {subtype: p.Type, properties})
            }
        )

        this.createNestedStackComponents(nestedStacks, args?.nestedStacks ?? {})

        this.template.Outputs && Object.entries(this.template.Outputs).forEach(
            ([name, p]:Array<any>) => this.componentNodes[name] = new Component(name, 'output', {subtype: p.Description, properties: p})
        )
    }

    createNestedStackComponents = (nestedStacksOuter: Record<string, any>, nestedStacksInner: Record<string, Record<any, any>>):void => {
        Object.entries(nestedStacksOuter).forEach(([name, r]) => {
            if({}.hasOwnProperty.call(nestedStacksInner, name)){
                const innerStack = nestedStacksInner[name]
                const parameters = Object.entries(r.Properties.Parameters ?? {})
                const model = new CloudFormationParser(innerStack, name).parse({parameterComponents:
                    Object.fromEntries(parameters.map(([innerPName, innerPVal]) => [innerPName, readRefsInExpression(innerPVal as Record<string, any>).map(ref => this.componentNodes[ref] as Component)]))
                })
                this.nestedModels.push(model)
            } else {
                throw Error(`Cannot evaluate nested stack '${name}'. Its template was not provided`)
            }
        })
    }

    addDependencyRelationshipsFromComponent = (component: ComponentNode): void => {
        if(!(component instanceof Component)) return
        if(component.type === 'resource' && typeof(component.properties.DependsOn) === 'string'){
            this.addDependencyRelationship(component, this.getComponentFromName(component.properties.DependsOn), 'DependsOn')
        }

        Object.entries(component.properties).forEach(([propName, propValue]) => {
            readRefsInExpression(propValue).map(ref =>
                this.addDependencyRelationship(component, this.getComponentFromName(ref), propName)
            )
        })
    }

    getComponentFromName = (componentName: string): Component => {
        const c = this.componentNodes[componentName]
        if(!(c instanceof Component)) throw Error(`Reference to component not found: ${componentName}`)
        return c
    }

    addDependencyRelationship = (sourceComponent: Component, targetComponent: Component, type: string):void => {
        const relationship = new DependencyRelationship(
            sourceComponent, targetComponent, type
        )

        sourceComponent.children.push(relationship)
        targetComponent.parents.push(relationship)
        
        this.relationships.push(relationship)
    }

    buildFinalModel = ():InfraModel => {
        const rootNode = new ComponentGroup(this.name)
        rootNode.children.push(...Object.values(this.componentNodes).map(
            (c: ComponentNode) => {
                const rel = new StructuralRelationship(rootNode, c, 'root')
                c.parents.push(rel)
                return rel
            }
        ))
        
        const nestedComponents = this.nestedModels.reduce((acc, model) => [...acc, ...model.componentNodes], [] as ComponentNode[])
        const nestedRelationships = this.nestedModels.reduce((acc, model) => [...acc, ...model.relationships], [] as Relationship[])
        this.nestedModels.forEach(m => {
            const rel = new StructuralRelationship(rootNode, m.rootNode, 'nestedStack')
            rootNode.children.push(rel)
            m.rootNode.parents.push(rel)
        })

        return new InfraModel(
            rootNode,
            [rootNode, ...Object.values(this.componentNodes), ...nestedComponents],
            [...rootNode.children, ...this.relationships, ...nestedRelationships]
        )
    }
}
