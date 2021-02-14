import { Component } from "./component"
import { ModelEntity } from "./model-entity"

export abstract class Relationship extends ModelEntity{

    source: Component
    target: Component

    type: string

    constructor(source: Component, target: Component, type: string, properties?:Record<string, any>){
        super(properties)
        this.source = source
        this.target = target
        this.type = type
    }
}