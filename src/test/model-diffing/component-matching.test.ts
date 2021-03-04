import { CDKParser } from "../../platform-mapping";
import { ParserUtilsCreator } from "../utils";
import {
    DiffCreator,
} from "../../model-diffing";

const dir = `test/model-diffing`;

const {
    readSampleInput,
    genGraphOnEnvFlag,
    stringifyComponents
} = ParserUtilsCreator(dir);

test('Matching basic template', () => {
    const oldModel = new CDKParser(readSampleInput('simple-template-before.json')).parse();
    const newModel = new CDKParser(readSampleInput('simple-template-after.json')).parse();

    genGraphOnEnvFlag(oldModel, 'simple-template-before');
    genGraphOnEnvFlag(newModel, 'simple-template-after');

    const diff = new DiffCreator({v1: oldModel, v2: newModel}).create();
    expect(stringifyComponents(diff)).toMatchSnapshot();
});

test('Matching big template', () => {
    const oldModel = new CDKParser(readSampleInput('kessel-run-stack-before.json')).parse();
    const newModel = new CDKParser(readSampleInput('kessel-run-stack-after.json')).parse();
    
    const diff = new DiffCreator({v1: oldModel, v2: newModel}).create();
    expect(stringifyComponents(diff)).toMatchSnapshot();
});