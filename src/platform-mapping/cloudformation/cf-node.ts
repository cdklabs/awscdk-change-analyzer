import { Component } from "../../infra-model/component"
import { DependencyRelationship } from "../../infra-model/dependency-relationship"
import { Relationship } from "../../infra-model/relationship"
import { StructuralRelationship } from "../../infra-model/structural-relationship"
import { CFParserArgs } from "./cf-parser-args"

export abstract class CFNode {

    component: Component
    dependencyRefs: Map<string, string[]>
    parserArgs: CFParserArgs
    rootComponent: Component

    constructor(name: string, definition: Record<string, any>, args: CFParserArgs, rootComponent: Component){
        this.rootComponent = rootComponent
        this.dependencyRefs = new Map(Object.entries(CFNode.readRefsInExpression(definition)))
        this.parserArgs = args
        this.component = this.generateComponent(name, definition)
    }

    abstract generateComponent(name: string, definition:Record<string, any>):Component

    createRelationshipsAndComponents(cfNodes: Record<string, CFNode>): [Relationship[], Component[]]{
        const rootRelationship = new StructuralRelationship(this.rootComponent, this.component, 'root')
        this.component.parents.add(rootRelationship)
        this.rootComponent.children.add(rootRelationship)

        const relationships = [
            ...Array.from(this.dependencyRefs)
                .flatMap(([type, refs]) =>
                    refs.map(ref =>
                        this.createDependencyRelationship(cfNodes[ref].component, type)
                )),
            rootRelationship
        ]

        return [relationships, [this.component]]
    }

    createDependencyRelationship = (targetComponent: Component, type: string): DependencyRelationship => {
        const relationship = new DependencyRelationship(
            this.component, targetComponent, type
        )

        this.component.children.add(relationship)
        targetComponent.parents.add(relationship)
        
        return relationship
    }
    
    static readRefsInPropertyMapping: Record<string, (s:any) => string[]> = Object.freeze({
        'Ref': (value: any) =>
            (typeof(value) === 'string' && !value.startsWith('AWS::'))
            ? [value] : [],
        'Fn::GetAtt': (value: any) => 
            Array.isArray(value) ? [value[0]] : [],
        'Fn::Sub': (value: any) => 
            Array.isArray(value) && typeof value[0] === 'string' && ((typeof value[1] === 'object' && value[1] !== null) || value[1] === undefined)
            ? [...value[0].matchAll(/\$\{[A-Za-z0-9]*\}/g)].map(v => v[0].slice(2,-1)).filter(v => !Object.keys(value[1]).includes(v))
            : []
    })

    static readRefsInExpression = (expression: any, refPath?: string): Record<string, string[]> => {
        if(typeof(expression) !== 'object' || expression == null)
            return {}
        else {
            return Object.entries(expression).reduce((acc, [k, v]) => {
                const newRefPath = refPath ? `${refPath}.${k}` : k
                let refs
                return {...acc,
                    ...CFNode.readRefsInPropertyMapping[k] && (refs = CFNode.readRefsInPropertyMapping[k](v))
                        ? {[newRefPath]: refs}
                        : CFNode.readRefsInExpression(v, newRefPath)
                }
            }, {})
        }
    }
    
}