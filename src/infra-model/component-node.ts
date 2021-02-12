import { ModelEntity } from "./model-entity"
import { Relationship } from "./relationship"

interface ComponentNodeConstructorArgs {
    name?: string,
    properties?: Record<any, any>
}

export abstract class ComponentNode extends ModelEntity {
    
    parents: Set<Relationship> = new Set()
    children: Set<Relationship> = new Set()

    name: string

    constructor({properties, name}: ComponentNodeConstructorArgs){
        super(properties)
        this.name = name ?? "unnamed"
    }

}