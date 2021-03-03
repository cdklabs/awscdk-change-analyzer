import { Component, Relationship } from "../../infra-model";
import { Transition } from "../transition";
import { PropertyOperation } from "./property-operation";

export abstract class ComponentOperation {
    constructor(public readonly componentTransition: Transition<Component>){}
}

export class InsertComponentOperation extends ComponentOperation {
    constructor(
        public readonly newComponent: Component,
    ){super({v2: newComponent});}
}

export class RemoveComponentOperation extends ComponentOperation {
    constructor(
        public readonly prevComponent: Component
    ){super({v1: prevComponent});}
}

export class UpdatePropertiesComponentOperation extends ComponentOperation {
    constructor(
        componentTransition: Transition<Component>,
        public readonly operation: PropertyOperation,
    ){super(componentTransition);}
}

export class RenameComponentOperation extends ComponentOperation {
    constructor(
        componentTransition: Transition<Component>
    ){super(componentTransition);}
}

export class OutgoingComponentOperation extends ComponentOperation {

    public readonly relationshipTransition: Transition<Relationship>;

    constructor(
        componentTransition: Transition<Component>,
        public readonly outgoingRelationships: Transition<Relationship>,
    ){super(componentTransition);}
}

export class InsertOutgoingComponentOperation extends OutgoingComponentOperation {
    constructor(
        componentTransition: Transition<Component>,
        relationship: Relationship
    ){super(componentTransition, {v2: relationship});}
}

export class RemoveOutgoingComponentOperation extends OutgoingComponentOperation {
    constructor(
        componentTransition: Transition<Component>,
        relationship: Relationship
    ){super(componentTransition, {v1: relationship});}
}

export class UpdateOutgoingComponentOperation extends OutgoingComponentOperation {
    constructor(
        componentTransition: Transition<Component>,
        public readonly newRelationship: Relationship,
        public readonly oldRelationship: Relationship
    ){super(componentTransition, {v1: oldRelationship, v2: newRelationship});}
}