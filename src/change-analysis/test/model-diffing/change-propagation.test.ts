import {
    propagateChanges,
    ReplaceComponentOperation,
    UpdatePropertyComponentOperation,
} from "../../model-diffing";
import { Component, ComponentPropertyPrimitive, ComponentPropertyRecord, ComponentUpdateType, DependencyRelationship, InfraModel } from "../../infra-model";
import { InfraModelDiff } from "../../model-diffing/infra-model-diff";


const createTestCase1 = (): InfraModelDiff => {
    const component1v1 = new Component('component1', 'resource', {
        subtype: "AWS::IAM::Role",
        properties: new ComponentPropertyRecord(
            {
                someKey: new ComponentPropertyPrimitive("someValue", ComponentUpdateType.REPLACEMENT)
            }, ComponentUpdateType.REPLACEMENT
        )
    });
    const component2v1 = new Component('component2', 'resource', {
        subtype: "AWS::EC2::Instance",
        properties: new ComponentPropertyRecord({
                nested: new ComponentPropertyRecord({
                    propComp2: new ComponentPropertyPrimitive("value", ComponentUpdateType.REPLACEMENT)
                }, ComponentUpdateType.REPLACEMENT)
            }, ComponentUpdateType.REPLACEMENT
        )
    });
    const relationship1v1 = new DependencyRelationship(component2v1, component1v1, 'relationship1', {sourcePropertyPath: ["nested", "propComp2"]});
    component1v1.addIncoming(relationship1v1);
    component2v1.addOutgoing(relationship1v1);
    const infraModelv1 = new InfraModel([component1v1, component2v1], [relationship1v1]);

    const component1v2 = new Component('component1', 'resource', {
        subtype: "AWS::IAM::Role",
        properties: new ComponentPropertyRecord(
            {
                someKey: new ComponentPropertyPrimitive("someValueChanged", ComponentUpdateType.REPLACEMENT)
            }, ComponentUpdateType.REPLACEMENT
        )
    });
    const component2v2 = new Component('component2', 'resource', {
        subtype: "AWS::EC2::Instance",
        properties: new ComponentPropertyRecord({
            nestedNameChanged: new ComponentPropertyRecord({
                propComp2NameChanged: new ComponentPropertyPrimitive("value", ComponentUpdateType.REPLACEMENT)
            }, ComponentUpdateType.REPLACEMENT)
        }, ComponentUpdateType.REPLACEMENT
        )
    });
    const relationship1v2 = new DependencyRelationship(component2v2, component1v2, 'relationship1', {sourcePropertyPath: ["nestedNameChanged", "propComp2NameChanged"]});
    component1v2.addIncoming(relationship1v2);
    component2v2.addOutgoing(relationship1v2);
    const infraModelv2 = new InfraModel([component1v2, component2v2], [relationship1v2]);

    const component1Transition = {v1: component1v1, v2: component1v2};
    const component2Transition = {v1: component2v1, v2: component2v2};

    const directChangeComponent1 = new UpdatePropertyComponentOperation(
        {v1: ["someKey"], v2: ["someKey"]},
        {
            v1: component1v1.properties.getRecord()["someKey"], 
            v2: component1v2.properties.getRecord()["someKey"], 
        },
        component1Transition,
    );

    const directChangeComponent2 = new UpdatePropertyComponentOperation(
        {v1: ["nested", "propComp2"], v2: ["nestedNameChanged", "propComp2NameChanged"]},
        {
            v1: component2v1.properties.getRecord()["nested"].getRecord()["propComp2"], 
            v2: component2v2.properties.getRecord()["nestedNameChanged"].getRecord()["propComp2NameChanged"], 
        },
        component2Transition
    );

    const infraModelTransition = {v1: infraModelv1, v2: infraModelv2};
    
    return new InfraModelDiff([directChangeComponent1, directChangeComponent2], [component1Transition, component2Transition], infraModelTransition);
};

test('Basic Replacement from Property Change', () => {
    
    const diff = createTestCase1();
    const propagatedDiff = propagateChanges(diff);
    const operations = propagatedDiff.componentOperations;

    const originalUpdateComponent1 = operations.find(o => o instanceof UpdatePropertyComponentOperation
        && o.componentTransition.v1.name === "component1"
        && !o.cause);
    const originalUpdateComponent2 = operations.find(o => o instanceof UpdatePropertyComponentOperation
        && o.componentTransition.v1.name === "component2"
        && !o.cause);
    
    expect(originalUpdateComponent1).toBeDefined();
    expect(originalUpdateComponent2).toBeDefined();
    
    const replacementComp1CausedByOriginalUpdate = operations.find(o => o instanceof ReplaceComponentOperation
        && o.componentTransition.v1.name === "component1"
        && o.cause === originalUpdateComponent1
    );
    const replacementComp2CausedByOriginalUpdate = operations.find(o => o instanceof ReplaceComponentOperation
        && o.componentTransition.v1.name === "component2"
        && o.cause === originalUpdateComponent2
    );

    expect(replacementComp1CausedByOriginalUpdate).toBeDefined();
    expect(replacementComp2CausedByOriginalUpdate).toBeDefined();

    const updateComp2CausedByReplacementComp1 = operations.find(o => o instanceof UpdatePropertyComponentOperation
        && o.componentTransition.v1.name === "component2"
        && o.cause === replacementComp1CausedByOriginalUpdate
    );
    const replacementComp2CausedByUpdateComp2CausedByReplacementComp1 = operations.find(o => o instanceof ReplaceComponentOperation
        && o.componentTransition.v1.name === "component2"
        && o.cause === updateComp2CausedByReplacementComp1
    );

    expect(updateComp2CausedByReplacementComp1).toBeDefined();
    expect(replacementComp2CausedByUpdateComp2CausedByReplacementComp1).toBeDefined();

    expect(operations.length).toBe(6);
});


test('ReplaceOperation-caused PropertyUpdate should have the proper property paths', () => {
    
    const diff = createTestCase1();
    const propagatedDiff = propagateChanges(diff);
    const operations = propagatedDiff.componentOperations;

    const updateCausedByReplacement = operations.find(o =>
        o instanceof UpdatePropertyComponentOperation
        && o.cause instanceof ReplaceComponentOperation) as UpdatePropertyComponentOperation;
    expect(updateCausedByReplacement).toBeDefined();
    expect(updateCausedByReplacement.pathTransition).toEqual({v1: ["nested", "propComp2"], v2: ["nestedNameChanged", "propComp2NameChanged"]});
});
