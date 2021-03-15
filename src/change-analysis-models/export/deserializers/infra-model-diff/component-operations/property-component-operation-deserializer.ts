import { Component, ComponentProperty } from "../../../../infra-model";
import {
    InsertPropertyComponentOperation,
    MovePropertyComponentOperation,
    PropertyComponentOperation,
    RemovePropertyComponentOperation,
    UpdatePropertyComponentOperation,
    Transition
} from "../../../../model-diffing/";
import { JSONSerializable, Serialized } from "../../../json-serializable";
import { SerializationID } from "../../../json-serializer";
import { SerializedPropertyComponentOperation, SerializedUpdatePropertyComponentOperation } from "../../../serialized-interfaces/infra-model-diff/serialized-component-operation";
import { deserializeComponentOperationOptions } from "./utils";

export function insertPropertyComponentOperationDeserializer(obj: Serialized, deserialize: (obj: SerializationID) => JSONSerializable): JSONSerializable {
    const serialized = obj as SerializedPropertyComponentOperation;

    const componentTransition = deserialize(serialized.componentTransition) as Transition<Component>;
    if(!componentTransition.v2 || !componentTransition.v1)
        throw Error("'Insert Property' Component Operation does not have both Component versions");

    const pathTransition = serialized.pathTransition;
    const propertyTransition = deserialize(serialized.propertyTransition) as Transition<ComponentProperty>;

    if(!pathTransition.v2 || !propertyTransition.v2)
        throw Error("'Insert Property' Component Operation does not have new property and its path");

    const options = deserializeComponentOperationOptions(serialized, deserialize);

    return new InsertPropertyComponentOperation(pathTransition, propertyTransition, componentTransition, options);
}

export function removePropertyComponentOperationDeserializer(obj: Serialized, deserialize: (obj: SerializationID) => JSONSerializable): JSONSerializable {
    const serialized = obj as SerializedPropertyComponentOperation;

    const componentTransition = deserialize(serialized.componentTransition) as Transition<Component>;
    if(!componentTransition.v2 || !componentTransition.v1)
        throw Error("'Remove Property' Component Operation does not have both Component versions");

    const pathTransition = serialized.pathTransition;
    const propertyTransition = deserialize(serialized.propertyTransition) as Transition<ComponentProperty>;
    if(!pathTransition.v1 || !propertyTransition.v1)
        throw Error("'Remove Property' Component Operation does not have an old property and its path");

    const options = deserializeComponentOperationOptions(serialized, deserialize);

    return new RemovePropertyComponentOperation(pathTransition, propertyTransition, componentTransition, options);
}

export function movePropertyComponentOperationDeserializer(obj: Serialized, deserialize: (obj: SerializationID) => JSONSerializable): JSONSerializable {
    const serialized = obj as SerializedPropertyComponentOperation;

    const componentTransition = deserialize(serialized.componentTransition) as Transition<Component>;
    if(!componentTransition.v2 || !componentTransition.v1)
        throw Error("'Move Property' Component Operation does not have both Component versions");

    const pathTransition = serialized.pathTransition;
    const propertyTransition = deserialize(serialized.propertyTransition) as Transition<ComponentProperty>;
    if(!pathTransition.v1 || !propertyTransition.v1)
        throw Error("'Move Property' Component Operation does not have both property and path versions");

    const options = deserializeComponentOperationOptions(serialized, deserialize);

    return new MovePropertyComponentOperation(pathTransition, propertyTransition, componentTransition, options);
}

export function updatePropertyComponentOperationDeserializer(obj: Serialized, deserialize: (obj: SerializationID) => JSONSerializable): JSONSerializable {
    const serialized = obj as SerializedUpdatePropertyComponentOperation;

    const componentTransition = deserialize(serialized.componentTransition) as Transition<Component>;
    if(!componentTransition.v2 || !componentTransition.v1)
        throw Error("'Update Property' Component Operation does not have both Component versions");

    const pathTransition = serialized.pathTransition;
    const propertyTransition = deserialize(serialized.propertyTransition) as Transition<ComponentProperty>;
    if(!pathTransition.v1 || !propertyTransition.v1)
        throw Error("'Update Property' Component Operation does not have both property and path versions");

    const options = deserializeComponentOperationOptions(serialized, deserialize);
    const innerOperations = serialized.innerOperations ? serialized.innerOperations.map(deserialize) as PropertyComponentOperation[] : undefined;

    return new UpdatePropertyComponentOperation(pathTransition, propertyTransition, componentTransition, options, innerOperations);
}