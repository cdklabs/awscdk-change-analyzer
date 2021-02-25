import { Component, Relationship } from "../../infra-model";
import { PropertyDiff } from "../property-diff";

interface OperationComponents {
    readonly prevComponent?: Component,
    readonly newComponent?: Component
}

export abstract class ComponentOperation {

    public readonly prevComponent?: Component;
    public readonly newComponent?: Component;

    constructor({prevComponent, newComponent}: OperationComponents){
        this.prevComponent = prevComponent;
        this.newComponent = newComponent;
    }
}

export class InsertComponentOperation extends ComponentOperation {
    constructor(
        public readonly newComponent: Component,
    ){super({newComponent});}
}

export class RemoveComponentOperation extends ComponentOperation {
    constructor(
        public readonly prevComponent: Component
    ){super({prevComponent});}
}

export class UpdateComponentOperation extends ComponentOperation {
    constructor(
        components: OperationComponents,
        public readonly propertyDiff?: PropertyDiff,
    ){super(components);}
}

export class RenameComponentOperation extends ComponentOperation {
    constructor(
        components: OperationComponents
    ){super(components);}
}

export class InsertOutgoingComponentOperation extends ComponentOperation {
    constructor(
        components: OperationComponents,
        public readonly relationship: Relationship
    ){super(components);}
}

export class RemoveOutgoingComponentOperation extends ComponentOperation {
    constructor(
        components: OperationComponents,
        public readonly realtionship: Relationship
    ){super(components);}
}

export class UpdateOutgoingComponentOperation extends ComponentOperation {
    constructor(
        components: OperationComponents,
        public readonly newRelationship: Relationship,
        public readonly oldRelationship: Relationship
    ){super(components);}
}