import { Component } from "../../../../infra-model";
import {
    InsertComponentOperation,
    RemoveComponentOperation,
    RenameComponentOperation,
    ReplaceComponentOperation,
    Transition
} from "../../../../model-diffing/";
import { JSONSerializable, Serialized } from "../../../json-serializable";
import { SerializationID } from "../../../json-serializer";
import { SerializedComponentOperation } from "../../../serialized-interfaces/infra-model-diff/serialized-component-operation";
import { deserializeComponentOperationOptions } from "./utils";

export function insertComponentOperationDeserializer(obj: Serialized, deserialize: (obj: SerializationID) => JSONSerializable): JSONSerializable {
    const serialized = obj as SerializedComponentOperation;

    const componentTransition = deserialize(serialized.componentTransition) as Transition<Component>;
    if(!componentTransition.v2)
        throw Error("Insert Component Operation does not have a new Component");

    const options = deserializeComponentOperationOptions(serialized, deserialize);

    return new InsertComponentOperation(componentTransition.v2, options);
}

export function removeComponentOperationDeserializer(obj: Serialized, deserialize: (obj: SerializationID) => JSONSerializable): JSONSerializable {
    const serialized = obj as SerializedComponentOperation;

    const componentTransition = deserialize(serialized.componentTransition) as Transition<Component>;
    if(!componentTransition.v1)
        throw Error("Remove Component Operation does not have an old Component");

    const options = deserializeComponentOperationOptions(serialized, deserialize);

    return new RemoveComponentOperation(componentTransition.v1, options);
}

export function replaceComponentOperationDeserializer(obj: Serialized, deserialize: (obj: SerializationID) => JSONSerializable): JSONSerializable {
    const serialized = obj as SerializedComponentOperation;

    const componentTransition = deserialize(serialized.componentTransition) as Transition<Component>;
    if(!componentTransition.v1 || !componentTransition.v2)
        throw Error("Replace Component Operation does not have both Components");

    const options = deserializeComponentOperationOptions(serialized, deserialize);

    return new ReplaceComponentOperation(componentTransition, options);
}

export function renameComponentOperationDeserializer(obj: Serialized, deserialize: (obj: SerializationID) => JSONSerializable): JSONSerializable {
    const serialized = obj as SerializedComponentOperation;

    const componentTransition = deserialize(serialized.componentTransition) as Transition<Component>;
    if(!componentTransition.v1 || !componentTransition.v2)
        throw Error("Rename Component Operation does not have both Components");

    const options = deserializeComponentOperationOptions(serialized, deserialize);

    return new RenameComponentOperation(componentTransition, options);
}