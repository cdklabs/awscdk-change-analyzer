import { CFParser } from "../../../platform-mapping/cloudformation/cf-parser"
import * as fs from 'fs'
import { DependencyRelationship } from "../../../infra-model/dependency-relationship"
import { Component } from "../../../infra-model/component"
import { generateGraph } from "../../../visualization/graph-generator"
import { InfraModel } from "../../../infra-model/infra-model"


const cloudformationDir = `platform-mapping/cloudformation`

const readSampleInput = (filename) => JSON.parse(fs.readFileSync(`${cloudformationDir}/sample-inputs/${filename}`, 'utf8'))

const genGraphOnEnvFlag = (model: InfraModel, filename) => process.env.RENDER_GRAPHS && generateGraph(model, `${cloudformationDir}/sample-outputs/${filename}`)

const stringifyModel = (model:Component[]) => {
    const cache = new Set()

    return JSON.stringify(model, (key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (cache.has(value)) return `[dup-ref]${value instanceof Component ? value.name : key}`
            cache.add(value)
        }
        return value
    }, 4)
}

test('cfn-simple-template', () => {
    const cfnTemplate = readSampleInput('integ.dynamodb.expected.json')
    const parser = new CFParser(cfnTemplate)
    const model = parser.parse()

    genGraphOnEnvFlag(model, 'integ.dynamodb.expected')

    expect(stringifyModel(model.components)).toMatchSnapshot()
    expect(model.components.length).toBe(7)
    expect(model.relationships.length).toBe(10)
    expect(model.relationships.filter(r => r instanceof DependencyRelationship).length).toBe(4)
})

test('cfn-complex-template', () => {
    const cfnTemplate = readSampleInput('integ.instance.expected.json')
    const parser = new CFParser(cfnTemplate)
    const model = parser.parse()

    genGraphOnEnvFlag(model, 'integ.instance.expected')

    expect(stringifyModel(model.components)).toMatchSnapshot()
    expect(model.components.length).toBe(40)
    expect(model.relationships.length).toBe(90)
    expect(model.relationships.filter(r => r instanceof DependencyRelationship).length).toBe(51)
})

test('cfn-nested-template', () => {
    const cfnTemplateOuter = readSampleInput('nested-stacks-outer.json')
    const cfnTemplateInner = readSampleInput('nested-stacks-inner.json')

    const parser = new CFParser(cfnTemplateOuter)
    const model = parser.parse({nestedStacks: {"NestedStack": cfnTemplateInner}})
    
    genGraphOnEnvFlag(model, 'nested-stacks')

    expect(stringifyModel(model.components)).toMatchSnapshot()
    expect(model.components.length).toBe(8)
    expect(model.relationships.length).toBe(17)
    expect(model.relationships.filter(r => r instanceof DependencyRelationship).length).toBe(10)
})