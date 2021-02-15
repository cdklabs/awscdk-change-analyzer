import { Component } from "../../infra-model/component"
import { DependencyRelationship } from "../../infra-model/dependency-relationship"
import { Relationship } from "../../infra-model/relationship"
import { StructuralRelationship } from "../../infra-model/structural-relationship"
import { CFParserArgs } from "./cf-parser-args"
import { CFRef, CFRefInitError } from "./cf-ref"

export abstract class CFEntity {

    component: Component
    dependencyRefs: CFRef[]
    parserArgs: CFParserArgs
    templateRoot: Component

    constructor(name: string, definition: Record<string, any>, args: CFParserArgs, templateRoot: Component){
        this.templateRoot = templateRoot
        this.dependencyRefs = CFEntity.readRefsInExpression(definition)
        this.parserArgs = args
        this.component = this.generateComponent(name, definition)
    }

    abstract generateComponent(name: string, definition:Record<string, any>):Component

    createRelationshipsAndComponents(cfEntities: Record<string, CFEntity>): [Relationship[], Component[]]{
        const rootRelationship = new StructuralRelationship(this.templateRoot, this.component, 'root')
        this.component.parents.add(rootRelationship)
        this.templateRoot.children.add(rootRelationship)

        const relationships = [
            ...Array.from(this.dependencyRefs)
                .flatMap(ref =>
                    this.createDependencyRelationship(cfEntities[ref.logicalId].component, ref.getDescription())
                ),
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
    
    static readRefsInPropertyMapping: Record<string, (path:string[], value:any) => CFRef[]> = Object.freeze({
        'Ref': (path:string[], value: any) => [new CFRef(path, value)],
        'Fn::GetAtt': (path:string[], value: any) => {
            if(Array.isArray(value))
                return [new CFRef(path, value[0], value[1])]
            throw new CFRefInitError("GetAtt does not follow the right structure")
        },
        'Fn::Sub': (path: string[], value: any) => {
            if(Array.isArray(value)
                && typeof value[0] === 'string'
                && (
                    (typeof value[1] === 'object' && value[1] !== null)
                    || value[1] === undefined
            ))
                return [...value[0].matchAll(/\$\{[A-Za-z0-9\.]*\}/g)]
                    .map(v => v[0].slice(2,-1))
                    .filter(v => !Object.keys(value[1])
                    .includes(v)
                ).map(r => new CFRef(path, r)) 
            throw new CFRefInitError("Fn::Sub does not follow the right structure")
        }
    })

    static readRefsInExpression = (expression: any, refPath?: string[]): CFRef[] => {
        if(typeof(expression) !== 'object' || expression == null)
            return []
        else {
            return Object.entries(expression).reduce((acc, [k, v]) => {
                const newRefPath = refPath ? [...refPath,k] : [k]
                let refs: CFRef[] = []
                if(CFEntity.readRefsInPropertyMapping[k]){
                    try{
                        refs = CFEntity.readRefsInPropertyMapping[k](newRefPath, v)
                    } catch (e) {
                        if(!(e instanceof CFRefInitError)) throw e
                    }
                }
                return [
                    ...acc,
                    ...refs,
                    ...CFEntity.readRefsInExpression(v, newRefPath)
                ]
            }, [] as CFRef[])
        }
    }
}