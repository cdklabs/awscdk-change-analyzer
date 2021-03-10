import * as fs from 'fs';
import { CFParser } from './platform-mapping';
import { generateGraph } from './visualization/graph-generator';


const cloudformationDir = `./platform-mapping/cloudformation`;
const cloudformationOutputDir = `${cloudformationDir}/sample-outputs`;
if(!fs.existsSync(cloudformationOutputDir)) fs.mkdirSync(cloudformationOutputDir);

fs.readdirSync(`${cloudformationDir}/sample-inputs`).forEach(sampleInputFilename => {
    const cfnTemplate = JSON.parse(fs.readFileSync(`${cloudformationDir}/sample-inputs/${sampleInputFilename}`, 'utf8'));
    const parser = new CFParser(cfnTemplate);
    generateGraph(parser.parse(), `${cloudformationOutputDir}/${sampleInputFilename}`);
});
