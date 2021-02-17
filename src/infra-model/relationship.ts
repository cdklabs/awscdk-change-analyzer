import { Component } from "./component";

/**
 * Relationships connect two components and
 * describe how they relate to each other
 */
export abstract class Relationship{

    public readonly source: Component;
    public readonly target: Component;

    public readonly type: string;

    constructor(source: Component, target: Component, type: string){
        this.source = source;
        this.target = target;
        this.type = type;
    }
}