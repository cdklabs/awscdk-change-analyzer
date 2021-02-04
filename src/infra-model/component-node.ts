import { ModelEntity } from "./model-entity"
import { Relationship } from "./relationship"

interface ComponentNodeConstructorArgs {
    name?: string,
    properties?: Record<any, any>
}

export abstract class ComponentNode extends ModelEntity {
    
    parents: Relationship[] = []
    children: Relationship[] = []

    name: string

    constructor({properties, name}: ComponentNodeConstructorArgs){
        super(properties)
        this.name = name ?? "unnamed"
    }

}