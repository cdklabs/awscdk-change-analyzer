import { AggCharacteristicValue } from "../../../aggregations";
import { SerializedRecord } from "../../json-serializable";
import { SerializationID } from "../../json-serializer";

export interface SerializedAggregation extends SerializedRecord {
    readonly entities: SerializationID[],
    readonly characteristics: Record<string, AggCharacteristicValue>,
    readonly subAggs?: SerializationID[],
    readonly descriptions?: string[]
}