import { Aggregation } from '../../../aggregations';
import { JSONSerializable, Serialized } from '../../json-serializable';
import { SerializationID } from '../../json-serializer';
import { SerializedAggregation } from '../../serialized-interfaces/aggregations/serialized-aggregation';

export function aggregationDeserializer<T extends JSONSerializable>(obj: Serialized, deserialize: (obj: SerializationID) => any): Aggregation<T> {
  const serialized = obj as SerializedAggregation;

  const agg = {
    entities: new Set(serialized.entities.map(deserialize) as T[]),
    characteristics: serialized.characteristics,
    subAggs: serialized.subAggs?.map(deserialize) as Aggregation<T>[],
    descriptions: serialized.descriptions,
  };

  if(agg.subAggs)
    agg.subAggs.forEach(a => a.parentAgg = agg);

  return agg;
}
