import * as fs from 'fs';
import { JSONSerializer, Transition } from 'cdk-change-analyzer-models';
import { createChangeAnalysisReport } from './change-analysis-report/create-change-analysis-report';
import { CDKParser } from './platform-mapping';

const readJSONFile = (sampleInputFilename: string) => JSON.parse(fs.readFileSync(sampleInputFilename, 'utf8'));


const args = process.argv.slice(2);

if(args.length !== 4){
  // eslint-disable-next-line no-console
  console.log('Usage: npm start -- <JSON Template 1 Path> <JSON Template 2 Path> <Rules Path> <Output Path>');
  process.exit();
}

const [v1Path, v2Path, rulesPath, outputPath] = args;

const oldModel = new CDKParser(readJSONFile(v1Path)).parse();
const newModel = new CDKParser(readJSONFile(v2Path)).parse();

const rules = readJSONFile(rulesPath);

const changeReport = createChangeAnalysisReport(new Transition({v1: oldModel, v2: newModel}), rules);

fs.writeFileSync(outputPath, new JSONSerializer().serialize(changeReport));

// eslint-disable-next-line no-console
console.log('Done!');
