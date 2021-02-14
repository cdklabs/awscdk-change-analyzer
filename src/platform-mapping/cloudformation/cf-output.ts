import { Component } from "../../infra-model/component"
import { CFEntity } from "./cf-entity"

export class CFOutput extends CFEntity {

    generateComponent(name: string, definition: Record<string, any>): Component {
        return new Component(name, 'output', {subtype: definition.Type, properties: definition})
    }
}