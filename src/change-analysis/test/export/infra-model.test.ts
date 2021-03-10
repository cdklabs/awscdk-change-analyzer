import { JSONSerializer } from "../../export/json-serializer";
import { JSONDeserializer } from "../../export/json-deserializer";
import { CDKParser } from "../../platform-mapping";
import { ParserUtilsCreator } from "../utils";
import { InfraModel } from "../../infra-model";
import { DiffCreator, InfraModelDiff } from "../../model-diffing";

const dir = `test/model-diffing`;

const { 
    readSampleInput,
    genGraphOnEnvFlag
} = ParserUtilsCreator(dir);

test('InfraModel toSerialized', () => {
    const cfnTemplate = readSampleInput('simple-template-before.json');
    const parser = new CDKParser(cfnTemplate);
    const model = parser.parse();
    const serialized = new JSONSerializer().serialize(model);
    const deserialized = new JSONDeserializer<InfraModel>().deserialize(serialized);
    expect(new DiffCreator({v1: model, v2: deserialized}).create().componentOperations.length).toBe(0);
    // expect(deserialized).toEqual(model);

});

test('InfraModelDiff toSerialized', () => {
    const oldModel = new CDKParser(readSampleInput('simple-template-before.json')).parse();
    const newModel = new CDKParser(readSampleInput('simple-template-after.json')).parse();

    genGraphOnEnvFlag(oldModel, 'simple-template-before');
    genGraphOnEnvFlag(newModel, 'simple-template-after');

    const diff = new DiffCreator({v1: oldModel, v2: newModel}).create();

    const serialized = new JSONSerializer().serialize(diff);
    const deserialized = new JSONDeserializer<InfraModelDiff>().deserialize(serialized);
    expect(deserialized.componentOperations.length).toBe(diff.componentOperations.length);
    expect(deserialized.componentTransitions.length).toBe(diff.componentTransitions.length);
    // expect(deserialized).toEqual(diff);
});