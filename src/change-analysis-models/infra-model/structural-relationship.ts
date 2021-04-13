import { SerializationClasses } from "../export/serialization-classes";
import { Component } from "./component";
import { Relationship } from "./relationship";

/**
 * StructuralRelationship establishes a conceptual hierarchy between
 * two components, impacting solely the user's perception of the infrastructure
 * and not its actual deployment.
 */
export class StructuralRelationship extends Relationship {

    constructor(source: Component, target: Component, type: string){
        super(source, target, {type});
    }

    public getSerializationClass(): string{
        return SerializationClasses.STRUCTURAL_RELATIONSHIP;
    }

}