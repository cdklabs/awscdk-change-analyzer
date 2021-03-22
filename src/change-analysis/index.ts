import * as fs from 'fs';
import { JSONSerializer } from 'change-cd-iac-models/export/json-serializer';
import { createChangeAnalysisReport } from './change-analysis-report/create-change-analysis-report';
import { CDKParser } from './platform-mapping';

const dir = 'test/model-diffing';
const readSampleInput = (sampleInputFilename: string) => JSON.parse(fs.readFileSync(`${dir}/sample-inputs/${sampleInputFilename}`, 'utf8'));

const oldModel = new CDKParser(readSampleInput('kessel-run-stack-before.json')).parse();
const newModel = new CDKParser(readSampleInput('kessel-run-stack-after.json')).parse();

console.log(
    new JSONSerializer().serialize(createChangeAnalysisReport({v1: oldModel, v2: newModel}))
    );

