import {
    ComponentOperation,
    Transition,
} from "change-analysis-models";
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
    const aggs = extractComponentOperationsAggs(diff, new Map());

    expect(aggs.length).toBe(1);
    expect(aggs[0].characteristics).toMatchObject({"RISK":"unknown"});
    const subAggs1 = aggs[0].subAggs;
    expect(subAggs1.length).toBe(2);
    expect(subAggs1[0].characteristics).toMatchObject({
        "Component Subtype": "AWS::IAM::Role",
        "Component Type": "resource",
        "Operation Type": "Update"
    });
    expect(subAggs1[1].characteristics).toMatchObject({
        "Component Subtype": "AWS::EC2::Instance",
        "Component Type": "resource",
        "Operation Type": "Update"
    });    
});


test('Group operations from big template', () => {
    const oldModel = new CDKParser(readSampleInput('kessel-run-stack-before.json')).parse();
    const newModel = new CDKParser(readSampleInput('kessel-run-stack-after.json')).parse();
    
    const diff = new DiffCreator(new Transition({v1: oldModel, v2: newModel})).create();
    const aggs = extractComponentOperationsAggs(diff, new Map());

    expect(aggs.length).toBe(1);
    expect(aggs[0].subAggs.length).toBe(10);
    expect(aggs[0].entities.size).toBe(86);
});