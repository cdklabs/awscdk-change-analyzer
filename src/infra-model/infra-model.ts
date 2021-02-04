import { ComponentNode } from "./component-node"
import { Relationship } from "./relationship"

export class InfraModel {
    rootNode: ComponentNode
    componentNodes: ComponentNode[]
    relationships: Relationship[]

    constructor(rootNode: ComponentNode, componentNodes: ComponentNode[], relationships: Relationship[]){
        this.rootNode = rootNode
        this.componentNodes = componentNodes
        this.relationships = relationships
    }
}