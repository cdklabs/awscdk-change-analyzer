import { Component, Relationship } from "../../infra-model";
import { Transition } from "../transition";
import { PropertyOperation } from "./property-operation";

export enum OperationCertainty {
    ABSOLUTE = 'Absolute',
    PARTIAL = 'Partial'
}

type ComponentOperationOptions = {
    readonly cause?: ComponentOperation | undefined;
    readonly certainty?: OperationCertainty
} 

export abstract class ComponentOperation {
    public readonly cause?: ComponentOperation;
    public readonly certainty: OperationCertainty;
    
    constructor(
        public readonly componentTransition: Transition<Component>,
        options?: ComponentOperationOptions
    ){
        this.certainty = options?.certainty ?? OperationCertainty.ABSOLUTE;
        this.cause = options?.cause;
    }

    public isDirectChange(): boolean{
        return !this.cause;
    }
}

export class InsertComponentOperation extends ComponentOperation {
    constructor(
        public readonly newComponent: Component,
        options?: ComponentOperationOptions
    ){super({v2: newComponent}, options);}
}

export class RemoveComponentOperation extends ComponentOperation {
    constructor(
        public readonly prevComponent: Component,
        options?: ComponentOperationOptions
    ){super({v1: prevComponent}, options);}
}

export class ReplaceComponentOperation extends ComponentOperation {}

export class UpdatePropertiesComponentOperation extends ComponentOperation {
    constructor(
        componentTransition: Transition<Component>,
        public operation: PropertyOperation,
        options?: ComponentOperationOptions
    ){super(componentTransition, options);}
}

export class RenameComponentOperation extends ComponentOperation {
    constructor(
        componentTransition: Transition<Component>,
        options?: ComponentOperationOptions
    ){super(componentTransition, options);}
}

export class OutgoingComponentOperation extends ComponentOperation {

    constructor(
        componentTransition: Transition<Component>,
        public readonly relationshipTransition: Transition<Relationship>,
        options?: ComponentOperationOptions
    ){super(componentTransition, options);}
}

export class InsertOutgoingComponentOperation extends OutgoingComponentOperation {
    constructor(
        componentTransition: Transition<Component>,
        relationship: Relationship,
        options?: ComponentOperationOptions
    ){super(componentTransition, {v2: relationship}, options);}
}

export class RemoveOutgoingComponentOperation extends OutgoingComponentOperation {
    constructor(
        componentTransition: Transition<Component>,
        relationship: Relationship,
        options?: ComponentOperationOptions
    ){super(componentTransition, {v1: relationship}, options);}
}

export class UpdateOutgoingComponentOperation extends OutgoingComponentOperation {
    constructor(
        componentTransition: Transition<Component>,
        public readonly relationshipTransition: Transition<Relationship>,
        options?: ComponentOperationOptions
    ){super(componentTransition, relationshipTransition, options);}
}