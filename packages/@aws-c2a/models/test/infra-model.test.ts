import { JSONDeserializer, JSONSerializer } from '../lib/export';
import {
  InfraModel,
} from '../lib/infra-model';
import { InfraModelDiff } from '../lib/model-diffing';
import { buildDiff, buildModelV1 } from './example-model';

// TODO: Fix these tests
test('InfraModel toSerialized', () => {
  const model = buildModelV1();
  const serialized = new JSONSerializer().serialize(model);
  const deserialized = new JSONDeserializer<InfraModel>().deserialize(serialized);
  deserialized;
  // expect(deserialized).toEqual(model);
});

test('InfraModelDiff toSerialized', () => {
  const diff = buildDiff();

  const serialized = new JSONSerializer().serialize(diff);
  const deserialized = new JSONDeserializer<InfraModelDiff>().deserialize(serialized);
  expect(deserialized.componentOperations.length).toBe(diff.componentOperations.length);
  expect(deserialized.componentTransitions.length).toBe(diff.componentTransitions.length);
  // expect(deserialized).toEqual(diff);
});