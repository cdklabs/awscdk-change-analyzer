import { JSONSerializable, Serialized } from "../export/json-serializable";
import { SerializationClasses } from "../export/serialization-classes";
import { SerializedAggregation } from "../export/serialized-interfaces/aggregations/serialized-aggregation";

export type AggCharacteristicValue =  string | number | boolean | undefined;

export interface Aggregation<T> {
    entities: Set<T>,
    characteristics: Record<string, AggCharacteristicValue>,
    subAggs?: Aggregation<T>[],
    parentAgg?: Aggregation<T>,
    descriptions?: string[]
}

export const aggregationSerializer = <T extends JSONSerializable>(
    ig: Aggregation<T>,
    serialize: (obj: JSONSerializable) => number,
    serializeCustom: (obj: any, serializationClass: string, serialized: Serialized) => number
): SerializedAggregation => {
    return {
        entities: [...ig.entities].map(e => serialize(e)),
        characteristics: ig.characteristics,
        subAggs: ig.subAggs?.map(sg => serializeCustom(
            sg, SerializationClasses.AGGREGATION, aggregationSerializer(sg, serialize, serializeCustom)
        )),
        descriptions: ig.descriptions
    };
};

export const getAllDescriptions = <T>(agg: Aggregation<T>): string[] => {
    const result: string[] = [];
    
    let a: Aggregation<T> | undefined = agg;
    while(a){
        if(a.descriptions)
            result.unshift(...a.descriptions);
        a = a.parentAgg;
    }

    return result;
};