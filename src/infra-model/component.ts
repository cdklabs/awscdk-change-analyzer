import { ComponentNode } from "./component-node"

interface ComponentNamedParameters {
    subtype?: string, properties: Record<string, any>
}

export class Component extends ComponentNode{
    
    type: string
    subtype?: string
    name: string

    constructor(name: string, type: string, {subtype, properties} : ComponentNamedParameters){
        super({name, properties})
        this.type = type
        this.subtype = subtype
    }
}
