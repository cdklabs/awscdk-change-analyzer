import * as fs from 'fs';
import { JSONSerializer } from 'change-cd-iac-models/export/json-serializer';
import { createChangeAnalysisReport } from './change-analysis-report/create-change-analysis-report';
import { CDKParser } from './platform-mapping';
import { Transition } from 'change-cd-iac-models/model-diffing';

const dir = '../experiment templates/exp2';
const readSampleInput = (sampleInputFilename: string) => JSON.parse(fs.readFileSync(`${dir}/${sampleInputFilename}`, 'utf8'));

const oldModel = new CDKParser(readSampleInput('before.json')).parse();
const newModel = new CDKParser(readSampleInput('after.json')).parse();

const changeReport = createChangeAnalysisReport(new Transition({v1: oldModel, v2: newModel}));

console.log(
    new JSONSerializer().serialize(changeReport)
);

