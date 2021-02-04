import { ComponentNode } from "./component-node"
import { ModelEntity } from "./model-entity"

export abstract class Relationship extends ModelEntity{

    source: ComponentNode
    target: ComponentNode

    type: string

    constructor(source: ComponentNode, target: ComponentNode, type: string, properties?:Record<string, any>){
        super(properties)
        this.source = source
        this.target = target
        this.type = type
    }
}