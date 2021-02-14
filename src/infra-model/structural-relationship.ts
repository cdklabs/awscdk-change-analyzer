import { Component } from "./component"
import { Relationship } from "./relationship"

export class StructuralRelationship extends Relationship {

    source: Component
    target: Component

    changesReplaceSource = false

    constructor(source: Component, target: Component, type: string, properties?: Record<string, any>){
        super(source, target, type, properties)
    }

}