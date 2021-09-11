import { JSONSerializable, Serialized } from '../export/json-serializable';
import { SerializationID } from '../export/json-serializer';
import { SerializationClasses } from '../export/serialization-classes';
import { Component, InfraModel, ModelEntity } from '../infra-model';
import { flatMap, groupArrayBy, isDefined } from '../utils';
import { ComponentOperation } from './operations';
import { Transition } from './transition';

export class TransitionNotFoundError extends Error {}

type OutgoingNodeReferences = {
  readonly componentOperations: ComponentOperation[],
  readonly componentTransitions: Transition<Component>[],
  readonly infraModelTransition: Transition<InfraModel>,
}

export class InfraModelDiff
  extends ModelEntity<Record<string, Serialized>, OutgoingNodeReferences>
  implements JSONSerializable
{
  private static createComponentTransitionMap(
    componentTransitions: Transition<Component>[],
  ): Map<Component, Transition<Component>> {
    return new Map(
      flatMap(componentTransitions, t => [[t.v1, t], [t.v2, t]])
        .filter(([v]) => isDefined(v)) as [Component, Transition<Component>][],
    );
  }

  private static createComponentTransitionToOperationsMap(
    componentOperations: ComponentOperation[],
  ): Map<Transition<Component>, ComponentOperation[]> {
    return groupArrayBy(componentOperations, o => o.componentTransition);
  }

  private readonly componentToTransitionMap: Map<Component, Transition<Component>>;
  private readonly componentTransitionToOperationsMap: Map<Transition<Component>, ComponentOperation[]>;

  public get componentOperations(): ComponentOperation[] {
    return this.outgoingNodeReferences.componentOperations;
  }
  public get componentTransitions(): Transition<Component>[] {
    return this.outgoingNodeReferences.componentTransitions;
  }
  public get infraModelTransition(): Transition<InfraModel> {
    return this.outgoingNodeReferences.infraModelTransition;
  }

  constructor(
    componentOperations: ComponentOperation[],
    componentTransitions: Transition<Component>[],
    infraModelTransition: Transition<InfraModel>,
  ){
    super('diff', {}, {componentOperations, componentTransitions, infraModelTransition});
    this.componentToTransitionMap = InfraModelDiff.createComponentTransitionMap(componentTransitions);
    this.componentTransitionToOperationsMap =
      InfraModelDiff.createComponentTransitionToOperationsMap(componentOperations);
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
      infraModelTransition: serialize(this.infraModelTransition),
    };
  }
  public getSerializationClass(): string {
    return SerializationClasses.INFRA_MODEL_DIFF;
  }
}