import { Component } from "../../infra-model/component"
import { DependencyRelationship } from "../../infra-model/dependency-relationship"
import { Relationship } from "../../infra-model/relationship"
import { StructuralRelationship } from "../../infra-model/structural-relationship"
import { CFParserArgs } from "./cf-parser-args"
import { CFRef } from "./cf-ref"

export abstract class CFEntity {

    component: Component
    dependencyRefs: CFRef[]
    parserArgs: CFParserArgs
    templateRoot: Component

    constructor(name: string, definition: Record<string, any>, args: CFParserArgs, templateRoot: Component){
        this.templateRoot = templateRoot
        this.dependencyRefs = CFRef.readRefsInExpression(definition)
        this.parserArgs = args
        this.component = this.generateComponent(name, definition)
    }

    abstract generateComponent(name: string, definition:Record<string, any>):Component

    createRelationshipsAndComponents(cfEntities: Record<string, CFEntity>, externalParameters?: Record<string, CFEntity[]>): [Relationship[], Component[]]{
        const rootRelationship = new StructuralRelationship(this.templateRoot, this.component, 'root')
        this.component.parents.add(rootRelationship)
        this.templateRoot.children.add(rootRelationship)

        const relationships = [
            ...Array.from(this.dependencyRefs)
                .map(ref => {
                    return this.createDependencyRelationship(cfEntities[ref.logicalId].getComponentInAttributePath(ref.destPath), ref.getDescription())
                }),
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

    getComponentInAttributePath = (attributePath:string[]): Component => {
        return this.component
    }
}