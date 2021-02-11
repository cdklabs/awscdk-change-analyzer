import { CloudFormationParser } from "../../../platform-mapping/cloudformation/parser"
import * as fs from 'fs'
import { DependencyRelationship } from "../../../infra-model/dependency-relationship"
import { Component } from "../../../infra-model/component"
import { ComponentNode } from "../../../infra-model/component-node"

const cloudformationDir = `platform-mapping/cloudformation`

const readSampleInput = (filename) => JSON.parse(fs.readFileSync(`${cloudformationDir}/sample-inputs/${filename}`, 'utf8'))

const stringifyModel = (model:ComponentNode[]) => {
    const cache = new Set()

    return JSON.stringify(model, (key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (cache.has(value)) return `[dup-ref]${value instanceof ComponentNode ? value.name : key}`
            cache.add(value)
        }
        return value
    }, 4)
}

test('cfn-simple-template', () => {
    const cfnTemplate = readSampleInput('integ.dynamodb.expected.json')
    const parser = new CloudFormationParser(cfnTemplate)
    const model = parser.parse()
    expect(stringifyModel(model.componentNodes)).toMatchSnapshot()
    expect(model.componentNodes.filter(c => !(c instanceof Component)).length).toBe(1)
    expect(model.componentNodes.length).toBe(7)
    expect(model.relationships.length).toBe(10)
    expect(model.relationships.filter(r => r instanceof DependencyRelationship).length).toBe(4)
})

test('cfn-complex-template', () => {
    const cfnTemplate = readSampleInput('integ.instance.expected.json')
    const parser = new CloudFormationParser(cfnTemplate)
    const model = parser.parse()
    expect(stringifyModel(model.componentNodes)).toMatchSnapshot()
    expect(model.componentNodes.filter(c => !(c instanceof Component)).length).toBe(1)
    expect(model.componentNodes.length).toBe(40)
    expect(model.relationships.length).toBe(90)
    expect(model.relationships.filter(r => r instanceof DependencyRelationship).length).toBe(51)
})

test('cfn-nested-template', () => {
    const cfnTemplateOuter = readSampleInput('nested-stacks-outer.json')
    const cfnTemplateInner = readSampleInput('nested-stacks-inner.json')

    const parser = new CloudFormationParser(cfnTemplateOuter)
    const model = parser.parse({nestedStacks: {"NestedStack": cfnTemplateInner}})
    expect(stringifyModel(model.componentNodes)).toMatchSnapshot()
    expect(model.componentNodes.filter(c => !(c instanceof Component)).length).toBe(2)
    expect(model.componentNodes.length).toBe(7)
    expect(model.relationships.length).toBe(8)
    expect(model.relationships.filter(r => r instanceof DependencyRelationship).length).toBe(2)
})