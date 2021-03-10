import { Component } from "../../infra-model";
import { CFEntity } from "./cf-entity";

export class CFOutput extends CFEntity {

    protected generateComponent(name: string, definition: Record<string, any>): Component {
        return new Component(name, 'output', {subtype: definition.Type, properties: this.cfDefinitionToComponentProperty(definition)});
    }
}