import { ComponentGroup } from "./component-group"
import { ComponentNode } from "./component-node"
import { Relationship } from "./relationship"

export class StructuralRelationship extends Relationship {

    source: ComponentGroup
    target: ComponentNode

    changesReplaceSource = false

    constructor(source: ComponentGroup, target: ComponentNode, type: string, properties?: Record<string, any>){
        super(source, target, type, properties)
    }

}