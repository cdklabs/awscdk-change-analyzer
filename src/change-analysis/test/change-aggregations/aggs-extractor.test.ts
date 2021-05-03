import {
    Transition,
} from "change-cd-iac-models/model-diffing";
import {
    extractComponentOperationsAggs,
} from "../../aggregations";
import { CDKParser } from "../../platform-mapping";
import { ParserUtilsCreator } from "../utils";
import {
    DiffCreator,
} from "../../model-diffing";
import { diffTestCase1 } from "../default-test-cases/infra-model-diff";

const dir = `test/change-aggregations`;

const {
    readSampleInput
} = ParserUtilsCreator(dir);

test('Extract Agg of operation type, component type and component subtype', () => {
    
    const diff = diffTestCase1();
    const groups = extractComponentOperationsAggs(diff, new Map());
});


test('Group operations from big template', () => {
    const oldModel = new CDKParser(readSampleInput('kessel-run-stack-before.json')).parse();
    const newModel = new CDKParser(readSampleInput('kessel-run-stack-after.json')).parse();
    
    const diff = new DiffCreator(new Transition({v1: oldModel, v2: newModel})).create();
    const aggregations = extractComponentOperationsAggs(diff, new Map());
});