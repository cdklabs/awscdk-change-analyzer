import { CFParser } from "../../../platform-mapping/cloudformation/cf-parser"
import * as fs from 'fs'
import { DependencyRelationship } from "../../../infra-model/dependency-relationship"
import { Component } from "../../../infra-model/component"
import { generateGraph } from "../../../visualization/graph-generator"
import { InfraModel } from "../../../infra-model/infra-model"
import { StructuralRelationship } from "../../../infra-model/structural-relationship"


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

test('CloudFormation simple template', () => {
    const cfnTemplate = readSampleInput('integ.dynamodb.expected.json')
    const parser = new CFParser(cfnTemplate)
    const model = parser.parse()

    genGraphOnEnvFlag(model, 'integ.dynamodb.expected')

    expect(stringifyModel(model.components)).toMatchSnapshot()
    expect(model.components.length).toBe(7)
    expect(model.relationships.length).toBe(10)
    expect(model.relationships.filter(r => r instanceof DependencyRelationship).length).toBe(4)
})

test('CloudFormation complex template', () => {
    const cfnTemplate = readSampleInput('integ.instance.expected.json')
    const parser = new CFParser(cfnTemplate)
    const model = parser.parse()

    genGraphOnEnvFlag(model, 'integ.instance.expected')

    expect(stringifyModel(model.components)).toMatchSnapshot()
    expect(model.components.length).toBe(40)
    expect(model.relationships.length).toBe(90)
    expect(model.relationships.filter(r => r instanceof DependencyRelationship).length).toBe(51)
})

test('CloudFormation nested template', () => {
    const cfnTemplateOuter = readSampleInput('nested-stacks-outer.json')
    const cfnTemplateInner = readSampleInput('nested-stacks-inner.json')

    const parser = new CFParser(cfnTemplateOuter)
    const model = parser.parse({nestedStacks: {"NestedStack": cfnTemplateInner}})
    
    genGraphOnEnvFlag(model, 'nested-stacks')

    expect(stringifyModel(model.components)).toMatchSnapshot()
    expect(model.components.length).toBe(8)
    expect(model.relationships.length).toBe(16)
    expect(model.relationships.filter(r => r instanceof DependencyRelationship).length).toBe(9)
})

test('Basic resources', () => {
    const parser = new CFParser({
        Resources: {
            "logicalId0": {
                Type: "AWS::IAM::Policy",
                Properties: {
                    property1: "propertyValue",
                    property2: { Ref: "logicalId1" }
                }
            },
            "logicalId1": {
                Type: "AWS::IAM::Policy",
            }
        }
    })
    const model = parser.parse()
    expect(model.components.length).toBe(3)
    expect(model.relationships.length).toBe(3)
    expect(model.relationships.filter(r => r instanceof DependencyRelationship).length).toBe(1)
})

test('Nested Stack Parameters\' dependencies', () => {
    const outer = {
        Parameters: {
            Parameter0: {
                Type: "String",
                Default: "defaultValue"
            }
        },
        Resources: {
            NestedStack: {
                Type: "AWS::CloudFormation::Stack",
                Properties: {
                    Parameters: {
                        InnerParameter0: { Ref: "Parameter0"}
                    }
                }
            },
        }
    }

    const inner = {
        Parameters: {
            InnerParameter0: {
                Type: "String",
                Default: "defaultValue"
            }
        }
    }
    
    const parser = new CFParser(outer)
    const model = parser.parse({nestedStacks: {NestedStack: inner}})
    expect(model.components.length).toBe(4)
    expect(model.relationships.length).toBe(5)
    expect(model.relationships.filter(r => r instanceof DependencyRelationship).length).toBe(2)
    expect(model.relationships.filter(r =>
        r instanceof DependencyRelationship
        && r.source.name === "InnerParameter0"
        && r.target.name === "Parameter0"
        && [...r.source.parents].filter(p => p instanceof StructuralRelationship && p.source.name === "NestedStack").length === 1
    ).length).toBe(1)
})

test('Nested Stack Outputs\' dependencies', () => {
    const outer = {
        Resources: {
            NestedStack: {
                Type: "AWS::CloudFormation::Stack",
                Properties: {}
            },
            Resource: {
                Type: "AWS::IAM::Role",
                Properties: {
                    Property: { "Fn::GetAtt": ["NestedStack", "Outputs.Output"] }
                }
            }
        },
    }

    const inner = {
        Outputs: {
            Output: {
                Value: "value"
            }
        }
    }
    
    const parser = new CFParser(outer)
    const model = parser.parse({nestedStacks: {NestedStack: inner}})
    expect(model.components.length).toBe(4)
    expect(model.relationships.length).toBe(5)
    expect(model.relationships.filter(r => r instanceof DependencyRelationship).length).toBe(2)
    expect(model.relationships.filter(r =>
        r instanceof DependencyRelationship
        && r.source.name === "Resource"
        && r.target.name === "Output"
    ).length).toBe(1)
})