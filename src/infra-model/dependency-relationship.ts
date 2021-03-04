import { Component } from "./component";
import { PropertyPath } from "./component-property";
import { Relationship } from "./relationship";

export type DependencyRelationshipOptions = {
    readonly sourcePropertyPath?: PropertyPath
    readonly targetAttributePath?: PropertyPath
}

/**
 * DependencyRelationship describes whether changes in the target component
 * impact the source component, and how.
 */
export class DependencyRelationship extends Relationship{

    public readonly sourcePropertyPath: PropertyPath
    public readonly targetAttributePath: PropertyPath

    constructor(source: Component, target: Component, type: string, options?: DependencyRelationshipOptions){
        super(source, target, type);
        this.sourcePropertyPath = options?.sourcePropertyPath ?? [];
        this.targetAttributePath = options?.targetAttributePath ?? [];
    }

}