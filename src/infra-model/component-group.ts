import { ComponentNode } from "./component-node"

export class ComponentGroup extends ComponentNode {

    name: string

    constructor(name?: string, properties?: Record<string, any>){
        super({properties})
        this.name = name ?? "Unnamed Component Group"
    }

}