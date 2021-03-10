import { ComponentOperation, ComponentOperationOptions, OperationCertainty } from "../../../../model-diffing";
import { Transition } from "../../../../model-diffing/transition";
import { JSONSerializable } from "../../../json-serializable";
import { SerializationID } from "../../../json-serializer";
import { SerializedComponentOperation } from "../../../serialized-interfaces/infra-model-diff/serialized-component-operation";

export function deserializeComponentOperationOptions(serialized: SerializedComponentOperation, deserialize: (obj: SerializationID) => JSONSerializable): ComponentOperationOptions {
    return {
        cause: serialized.cause ? deserialize(serialized.cause) as ComponentOperation : undefined,
        certainty: OperationCertainty[serialized.certainty as keyof typeof OperationCertainty],
    };
}