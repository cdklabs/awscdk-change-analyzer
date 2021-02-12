import { Component } from "../../infra-model/component"
import { CFNode } from "./cf-node"

export class CFOutput extends CFNode {

    generateComponentNode(name: string, definition: Record<string, any>): Component {
        return new Component(name, 'output', {subtype: definition.Type, properties: definition})
    }

}