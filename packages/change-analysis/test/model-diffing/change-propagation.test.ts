import {
    ReplaceComponentOperation,
    UpdatePropertyComponentOperation,
} from "change-analysis-models";
import { propagateChanges } from '../../model-diffing/';
import { diffTestCase1 } from "../default-test-cases/infra-model-diff";

test('Basic Replacement from Property Change', () => {
    
    const diff = diffTestCase1();
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
    
    const diff = diffTestCase1();
    const propagatedDiff = propagateChanges(diff);
    const operations = propagatedDiff.componentOperations;

    const updateCausedByReplacement = operations.find(o =>
        o instanceof UpdatePropertyComponentOperation
        && o.cause instanceof ReplaceComponentOperation) as UpdatePropertyComponentOperation;
    expect(updateCausedByReplacement).toBeDefined();
    expect(updateCausedByReplacement.pathTransition.v1).toEqual(["nested", "propComp2"]);
    expect(updateCausedByReplacement.pathTransition.v2).toEqual(["nestedNameChanged", "propComp2NameChanged"]);
});
