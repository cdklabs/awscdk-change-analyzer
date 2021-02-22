import { Component } from "./component";
import { Relationship } from "./relationship";

/**
 * DependencyRelationship describes whether changes in the target component
 * impact the source component, and how.
 */
export class DependencyRelationship extends Relationship{

    constructor(source: Component, target: Component, type: string){
        super(source, target, type);
    }

}