import { Component } from "../infra-model";
import { groupArrayBy, isDefined } from "../utils";
import { ComponentOperation } from "./operations";
import { Transition } from "./transition";
 
export class InfraModelDiff {

    private readonly componentToTransitionMap: Map<Component, Transition<Component>>;
    private readonly componentTransitionToOperationsMap: Map<Transition<Component>, ComponentOperation[]>;

    constructor(
        public readonly componentOperations: ComponentOperation[],
        public readonly componentTransitions: Transition<Component>[]
    ){
        this.componentToTransitionMap = InfraModelDiff.createComponentTransitionMap(componentTransitions);
        this.componentTransitionToOperationsMap = InfraModelDiff.createComponentTransitionToOperationsMap(componentOperations);
    }

    private static createComponentTransitionMap(
        componentTransitions: Transition<Component>[]
    ): Map<Component, Transition<Component>> {
        return new Map(
            componentTransitions.flatMap(t => [[t.v1, t], [t.v2, t]])
            .filter(([v]) => isDefined(v)) as [Component, Transition<Component>][]
        );
    }

    private static createComponentTransitionToOperationsMap(componentOperations: ComponentOperation[]) {
        return groupArrayBy(componentOperations, o => o.componentTransition);
    }

    public getComponentTransition(e: Component): Transition<Component>{
        const t = this.componentToTransitionMap.get(e);
        if(!t)
            throw Error(`Could not find component ${e.name} in model`);
        return t;
    }

    public getTransitionOperations(t: Transition<Component>): ComponentOperation[] {
        return this.componentTransitionToOperationsMap.get(t) ?? [];
    }
}