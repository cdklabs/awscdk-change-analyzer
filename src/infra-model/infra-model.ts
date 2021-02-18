import { Component } from "./component";
import { Relationship } from "./relationship";

export class InfraModel {
    public readonly components: Component[];
    public readonly relationships: Relationship[];

    constructor(components: Component[], relationships: Relationship[]){
        this.components = components;
        this.relationships = relationships;
    }
}