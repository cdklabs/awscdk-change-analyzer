import { CFParser } from "../../platform-mapping";
import {
    DiffCreator,
    InsertComponentOperation,
    InsertOutgoingComponentOperation,
    InsertPropertyComponentOperation,
    MovePropertyComponentOperation,
    RemoveComponentOperation,
    RemoveOutgoingComponentOperation,
    RenameComponentOperation,
    UpdatePropertyComponentOperation,
} from "../../model-diffing";

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

    const diff = new DiffCreator({v1: oldModel, v2: newModel}).create();

    expect(diff.componentOperations.length).toBe(1);
    expect(diff.componentOperations[0] instanceof UpdatePropertyComponentOperation).toBe(true);
    const propertyOperation = diff.componentOperations[0] as UpdatePropertyComponentOperation;
    expect(propertyOperation.pathTransition.v1).toEqual(['Properties', 'property1']);
    expect(propertyOperation.pathTransition.v2).toEqual(['Properties', 'property1']);
    expect((propertyOperation as UpdatePropertyComponentOperation).innerOperations).toBeUndefined();
});

test('Update Multiple Nested Component Properties', () => {
    const oldModel = new CFParser({
        Resources: {
            "logicalId0": {
                Type: "AWS::IAM::Policy",
                Properties: {
                    property1: {
                        propertyToDelete: 'value',
                        propertyToChange: 'changeme',
                        propertyToMove: 'moveme',
                        propertyToKeep: 'keep',
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
                        addedProperty: 'somecompletelydifferentvalue',
                        propertyToChange: 'changed',
                        movedProperty: 'moveme',
                        propertyToKeep: 'keep'
                    },
                    property2: { Ref: "logicalId1" }
                }
            },
            "logicalId1": {
                Type: "AWS::IAM::Policy",
            }
        }
    }).parse();

    const diff = new DiffCreator({v1: oldModel, v2: newModel}).create();
    expect(diff.componentOperations.length).toBe(1);
    expect(diff.componentOperations[0] instanceof UpdatePropertyComponentOperation).toBe(true);

    const propertyOperation = diff.componentOperations[0] as UpdatePropertyComponentOperation;
    expect(propertyOperation instanceof UpdatePropertyComponentOperation).toBe(true);
    expect(propertyOperation.pathTransition.v2).toEqual(['Properties', 'property1']);
    expect(propertyOperation.pathTransition.v1).toEqual(['Properties', 'property1']);

    const innerOperations = (propertyOperation as UpdatePropertyComponentOperation).innerOperations;

    expect(innerOperations.length).toBe(4);
    expect(innerOperations.filter(o => o instanceof MovePropertyComponentOperation).length).toBe(1);
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

    const diff = new DiffCreator({v1: oldModel, v2: newModel}).create();

    expect(diff.componentOperations.length).toBe(2);
    expect(diff.componentOperations.filter(o => o instanceof RemoveComponentOperation).length).toBe(1);
    expect(diff.componentOperations.filter(o => o instanceof RemoveOutgoingComponentOperation).length).toBe(1);
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

    const diff = new DiffCreator({v1: oldModel, v2: newModel}).create();

    expect(diff.componentOperations.length).toBe(2);
    expect(diff.componentOperations.filter(o => o instanceof InsertComponentOperation).length).toBe(1);
    expect(diff.componentOperations.filter(o => o instanceof InsertOutgoingComponentOperation).length).toBe(1);
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

    const diff = new DiffCreator({v1: oldModel, v2: newModel}).create();

    expect(diff.componentOperations.length).toBe(1);
    expect(diff.componentOperations[0] instanceof RenameComponentOperation).toBe(true);
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

    const diff = new DiffCreator({v1: oldModel, v2: newModel}).create();

    expect(diff.componentOperations.length).toBe(2);
    expect(diff.componentOperations.filter(o => o instanceof InsertOutgoingComponentOperation).length).toBe(1);
    expect(diff.componentOperations.filter(o => o instanceof InsertPropertyComponentOperation).length).toBe(1);
});