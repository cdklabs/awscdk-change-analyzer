import { Component } from "./component"
import { Relationship } from "./relationship"

export class InfraModel {
    root: Component
    components: Component[]
    relationships: Relationship[]

    constructor(root: Component, components: Component[], relationships: Relationship[]){
        this.root = root
        this.components = components
        this.relationships = relationships
    }
}