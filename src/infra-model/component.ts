import { ModelEntity } from "./model-entity"
import { Relationship } from "./relationship"

interface ComponentNamedParameters {
    subtype?: string, properties: Record<string, any>
}

export class Component extends ModelEntity {
    
    parents: Set<Relationship> = new Set()
    children: Set<Relationship> = new Set()

    type: string
    subtype?: string
    name: string

    constructor(name: string, type: string, namedArgs? : ComponentNamedParameters){
        super(namedArgs?.properties)
        this.name = name
        this.type = type
        this.subtype = namedArgs?.subtype
    }
}
