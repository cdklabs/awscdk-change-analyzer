import * as fs from 'fs'
import { CFParser } from './platform-mapping/cloudformation/cf-parser'
//import * as YAML from 'yaml'
import { generateGraph } from './visualization/graph-generator'


// const yamlSample = fs.readFileSync('./sample-cfn-template.yaml').toString()
// const cfnTemplate = YAML.parse(yamlSample)

const cloudformationDir = `./platform-mapping/cloudformation`
const cloudformationOutputDir = `${cloudformationDir}/sample-outputs`
if(!fs.existsSync(cloudformationOutputDir)) fs.mkdirSync(cloudformationOutputDir)

fs.readdirSync(`${cloudformationDir}/sample-inputs`).forEach(sampleInputFilename => {
    const cfnTemplate = JSON.parse(fs.readFileSync(`${cloudformationDir}/sample-inputs/${sampleInputFilename}`, 'utf8'))
    const parser = new CFParser(cfnTemplate)
    generateGraph(parser.parse(), `${cloudformationOutputDir}/${sampleInputFilename}`)
})

