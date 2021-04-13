import { JSONSerializable, Serialized } from "../export/json-serializable";
import { SerializationID } from "../export/json-serializer";
import { SerializationClasses } from "../export/serialization-classes";
import { Component, InfraModel } from "../infra-model";
import { groupArrayBy, isDefined } from "../utils";
import { ComponentOperation } from "./operations";
import { Transition } from "./transition";

export class TransitionNotFoundError extends Error {}
 
export class InfraModelDiff implements JSONSerializable {

    private readonly componentToTransitionMap: Map<Component, Transition<Component>>;
    private readonly componentTransitionToOperationsMap: Map<Transition<Component>, ComponentOperation[]>;

    constructor(
        public readonly componentOperations: ComponentOperation[],
        public readonly componentTransitions: Transition<Component>[],
        public readonly infraModelTransition: Transition<InfraModel>,
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
            throw new TransitionNotFoundError(`Could not find transition for component ${e.name} in model`);
        return t;
    }

    public getTransitionOperations(t: Transition<Component>): ComponentOperation[] {
        return this.componentTransitionToOperationsMap.get(t) ?? [];
    }

    public toSerialized(
        serialize: (obj: JSONSerializable) => SerializationID,
    ): Serialized {
        return {
            componentOperations: this.componentOperations.map(serialize),
            componentTransitions: this.componentTransitions.map(t => serialize(t)),
            infraModelTransition: serialize(this.infraModelTransition)
        };
    }
    public getSerializationClass(): string {
        return SerializationClasses.INFRA_MODEL_DIFF;
    }
}