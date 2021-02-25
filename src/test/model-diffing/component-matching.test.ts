import { CDKParser, CFParser } from "../../platform-mapping";
import { ParserUtilsCreator } from "../utils";
import { DiffCreator, InsertComponentOperation, InsertOutgoingComponentOperation, RemoveComponentOperation, RemoveOutgoingComponentOperation, RenameComponentOperation, UpdateComponentOperation, UpdatePropertyOperation } from "../../model-diffing";

const dir = `test/model-diffing`;

const {
    readSampleInput,
    genGraphOnEnvFlag,
    stringifyComponents
} = ParserUtilsCreator(dir);

test('Matching basic template', () => {
    const oldModel = new CDKParser(readSampleInput('simple-template-before.json')).parse();
    const newModel = new CDKParser(readSampleInput('simple-template-after.json')).parse();

    genGraphOnEnvFlag(oldModel, 'simple-template-before');
    genGraphOnEnvFlag(newModel, 'simple-template-after');

    const diff = new DiffCreator(oldModel, newModel).create();
    expect(stringifyComponents(diff)).toMatchSnapshot();
});

test('Matching big template', () => {
    const oldModel = new CDKParser(readSampleInput('kessel-run-stack-before.json')).parse();
    const newModel = new CDKParser(readSampleInput('kessel-run-stack-after.json')).parse();
    
    const diff = new DiffCreator(oldModel, newModel).create();
    expect(stringifyComponents(diff)).toMatchSnapshot();
});

test('Update Component Property', () => {
    const oldModel = new CFParser({
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
    }).parse();
    const newModel = new CFParser({
        Resources: {
            "logicalId0": {
                Type: "AWS::IAM::Policy",
                Properties: {
                    property1: "propValue2",
                    property2: { Ref: "logicalId1" }
                }
            },
            "logicalId1": {
                Type: "AWS::IAM::Policy",
            }
        }
    }).parse();

    const diff = new DiffCreator(oldModel, newModel).create();

    expect(diff.length).toBe(1);
    expect(diff[0] instanceof UpdateComponentOperation).toBe(true);
    const propertyOperation = (diff[0] as UpdateComponentOperation).propertyDiff.operation;
    expect(propertyOperation instanceof UpdatePropertyOperation).toBe(true);
    expect(propertyOperation.path).toEqual(['Properties', 'property1']);
    expect((propertyOperation as UpdatePropertyOperation).innerOperations).toBeUndefined();
});

test('Update Multiple Nested Component Properties', () => {
    const oldModel = new CFParser({
        Resources: {
            "logicalId0": {
                Type: "AWS::IAM::Policy",
                Properties: {
                    property1: {
                        propertyToDelete: 'value',
                        propertyToChange: 'changeme'
                    },
                    property2: { Ref: "logicalId1" }
                }
            },
            "logicalId1": {
                Type: "AWS::IAM::Policy",
            }
        }
    }).parse();
    const newModel = new CFParser({
        Resources: {
            "logicalId0": {
                Type: "AWS::IAM::Policy",
                Properties: {
                    property1: {
                        addedProperty: 'somevalue',
                        propertyToChange: 'changed'
                    },
                    property2: { Ref: "logicalId1" }
                }
            },
            "logicalId1": {
                Type: "AWS::IAM::Policy",
            }
        }
    }).parse();

    const diff = new DiffCreator(oldModel, newModel).create();
    expect(diff.length).toBe(1);
    expect(diff[0] instanceof UpdateComponentOperation).toBe(true);

    const propertyOperation = (diff[0] as UpdateComponentOperation).propertyDiff.operation;
    expect(propertyOperation instanceof UpdatePropertyOperation).toBe(true);
    expect(propertyOperation.path).toEqual(['Properties', 'property1']);

    const innerOperations = (propertyOperation as UpdatePropertyOperation).innerOperations;
    expect(innerOperations.length).toBe(3);
});

test('Remove Component', () => {
    const oldModel = new CFParser({
        Resources: {
            "logicalId0": {
                Type: "AWS::IAM::Policy",
                Properties: {
                    property1: "propertyValue"
                }
            },
            "logicalId1": {
                Type: "AWS::IAM::Policy",
            }
        }
    }).parse();
    const newModel = new CFParser({
        Resources: {
            "logicalId0": {
                Type: "AWS::IAM::Policy",
                Properties: {
                    property1: "propertyValue"
                }
            }
        }
    }).parse();

    const diff = new DiffCreator(oldModel, newModel).create();

    expect(diff.length).toBe(2);
    expect(diff.filter(o => o instanceof RemoveComponentOperation).length).toBe(1);
    expect(diff.filter(o => o instanceof RemoveOutgoingComponentOperation).length).toBe(1);
});

test('Insert Component', () => {
    const oldModel = new CFParser({
        Resources: {
            "logicalId0": {
                Type: "AWS::IAM::Policy",
                Properties: {
                    property1: "propertyValue"
                }
            },
        }
    }).parse();
    const newModel = new CFParser({
        Resources: {
            "logicalId0": {
                Type: "AWS::IAM::Policy",
                Properties: {
                    property1: "propertyValue"
                }
            },
            "logicalId1": {
                Type: "AWS::IAM::Policy",
            }
        }
    }).parse();

    const diff = new DiffCreator(oldModel, newModel).create();

    expect(diff.length).toBe(2);
    expect(diff.filter(o => o instanceof InsertComponentOperation).length).toBe(1);
    expect(diff.filter(o => o instanceof InsertOutgoingComponentOperation).length).toBe(1);
});

test('Renamed Component', () => {
    const oldModel = new CFParser({
        Resources: {
            "logicalId0": {
                Type: "AWS::IAM::Policy",
                Properties: {
                    property1: "propertyValue"
                }
            },
        }
    }).parse();
    const newModel = new CFParser({
        Resources: {
            "logicalId1": {
                Type: "AWS::IAM::Policy",
                Properties: {
                    property1: "propertyValue"
                }
            },
        }
    }).parse();

    const diff = new DiffCreator(oldModel, newModel).create();

    expect(diff.length).toBe(1);
    expect(diff[0] instanceof RenameComponentOperation).toBe(true);
});

test('Insert Relationship', () => {
    const oldModel = new CFParser({
        Resources: {
            "logicalId0": {
                Type: "AWS::IAM::Policy",
                Properties: {
                    property1: "propertyValue",
                }
            },
            "logicalId1": {
                Type: "AWS::IAM::Policy",
            }
        }
    }).parse();
    const newModel = new CFParser({
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
    }).parse();

    const diff = new DiffCreator(oldModel, newModel).create();

    expect(diff.length).toBe(2);
    expect(diff.filter(o => o instanceof InsertOutgoingComponentOperation).length).toBe(1);
    expect(diff.filter(o => o instanceof UpdateComponentOperation).length).toBe(1);
});