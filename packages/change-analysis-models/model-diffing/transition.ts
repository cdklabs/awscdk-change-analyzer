import { isDefined } from "fifinet";
import { isJSONSerializable, JSONSerializable, Serialized, SerializedRecord } from "../export/json-serializable";
import { SerializationID } from "../export/json-serializer";
import { SerializationClasses } from "../export/serialization-classes";
import { SerializedTransition } from "../export/serialized-interfaces/infra-model-diff/serialized-transition";
import { ModelEntity } from "../infra-model/model-entity";
import { ModelEntityTypes } from "../infra-model/model-entity-types";

/**
 * Represents two versions (v1 and v2) of an Entity
 */
export type TransitionVersions<T> = {
    v1?: T,
    v2?: T,
}

/**
 * Represents two versions (v1 and v2) of an Entity
 * where they both are defined
 */
export type CompleteTransitionVersions<T> = TransitionVersions<T> & {
    v1: T,
    v2: T
}

export class Transition<T extends JSONSerializable | Serialized, V extends TransitionVersions<T> = TransitionVersions<T>>
    extends ModelEntity<Record<string, any>, Record<string, any>>
    implements JSONSerializable {

    get v1(): T|undefined { return this.isModelEntityTransition ? this.outgoingNodeReferences.v1 : this.nodeData.v1; }
    get v2(): T|undefined { return this.isModelEntityTransition ? this.outgoingNodeReferences.v2 : this.nodeData.v2; }
    
    private isModelEntityTransition: boolean;
    constructor(versions: V){
        const isModelEntityTransition = Transition.isModelEntityTransition(versions);
        super(ModelEntityTypes.transition, isModelEntityTransition ? {} : versions, isModelEntityTransition ? versions : {});
        this.isModelEntityTransition = isModelEntityTransition;
    }

    public isCompleteTransition(): this is CompleteTransition<T> {
        return this.v1 !== undefined && this.v2 !== undefined;
    }

    public getSerializationClass(): string {
        return SerializationClasses.TRANSITION;
    }

    private static isModelEntityTransition(versions: TransitionVersions<any>): versions is TransitionVersions<ModelEntity> {
        return versions.v1 instanceof ModelEntity || versions.v2 instanceof ModelEntity;
    }

    public explode() {
        return [this.v1, this.v2].filter(isDefined);
    }

    public toSerialized(serialize: (obj: JSONSerializable) => SerializationID): SerializedTransition {
        const serializeVersion = (version: T) => isJSONSerializable(version) ? serialize(version) : {value: version as Serialized};
        
        return {
            v1: this.v1 ? serializeVersion(this.v1) : undefined,
            v2: this.v2 ? serializeVersion(this.v2) : undefined,
        };
    }
}

export class CompleteTransition<T extends JSONSerializable | Serialized> extends Transition<T, CompleteTransitionVersions<T>> {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    get v1(): T { return super.v1!; }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    get v2(): T { return super.v2!; }
    
    constructor(versions: CompleteTransitionVersions<T>){
        super(versions);
    }
}