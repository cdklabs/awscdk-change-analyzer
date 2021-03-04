import { ComponentProperty, ComponentPropertyArray, ComponentPropertyCollection, ComponentPropertyPrimitive, ComponentPropertyRecord, EmptyComponentProperty } from "../infra-model";
import { arrayIntersection, isDefined, stringSimilarity } from '../utils';
import { ComponentPropertiesMatcher } from "./entity-matchers/component-properties-matcher";
import { InsertPropertyOperation, PropertyOperation, RemovePropertyOperation, UpdatePropertyOperation, MovePropertyOperation } from "./operations";

/**
 * Describes how two ComponentProperties differ
 */
export class PropertyDiff {

    private constructor(
        public readonly similarity: number,
        public readonly weight: number,
        public readonly operation?: PropertyOperation,
    ){}

    public static fromProperties(p1: ComponentProperty, p2: ComponentProperty, basePathP1: Array<string | number> = [], basePathP2 = basePathP1): PropertyDiff {
        if(p1 instanceof ComponentPropertyRecord && p2 instanceof ComponentPropertyRecord){
            return PropertyDiff.fromRecordProperties(p1, p2, basePathP1, basePathP2);
        } else if(p1 instanceof ComponentPropertyArray && p2 instanceof ComponentPropertyArray){
            return PropertyDiff.fromArrayProperties(p1, p2, basePathP1, basePathP2);
        } else if(p1 instanceof ComponentPropertyPrimitive && p2 instanceof ComponentPropertyPrimitive){
            return PropertyDiff.fromPrimitives(p1, p2, basePathP1, basePathP2);
        } else if(p1 instanceof EmptyComponentProperty && p2 instanceof EmptyComponentProperty) {
            return new PropertyDiff(1, 0);
        }
        return PropertyDiff.fromDifferentProperties(p1, p2, basePathP1, basePathP2);
    }

    private static fromRecordProperties(
        p1: ComponentProperty,
        p2: ComponentProperty,
        pathP1: Array<string | number>,
        pathP2: Array<string | number>,
    ): PropertyDiff {
        const [a, b] = [p1,p2].map(p => p.getRecord());
        
        const sameNameKeys = arrayIntersection(Object.keys(a), Object.keys(b));
        const pickedSameNames = sameNameKeys
            .map((k): [string, PropertyDiff] => [k, PropertyDiff.fromProperties(a[k], b[k], [...pathP1, k], [...pathP2, k])])
            .filter(([, pd]) => pd.similarity >= ComponentPropertiesMatcher.similarityThreshold);

        const pickedSameNameKeys = new Set(pickedSameNames.map(([k]) => k));
        const sameNameDiffs = pickedSameNames.map(([, pd]) => pd);

        const renamedDiffMatchResults = new ComponentPropertiesMatcher(
            Object.entries(a).filter(([k]) => !pickedSameNameKeys.has(k)),
            Object.entries(b).filter(([k]) => !pickedSameNameKeys.has(k)),
            pathP1, pathP2
        ).match();
        
        const renamedDiffs = renamedDiffMatchResults.matches.map(({transition: {v1, v2}, metadata: propDiff}) => {
            if(!v1 || !v2)
                throw Error("Entity matching returned undefined versions");
            return new PropertyDiff(
                propDiff.similarity,
                propDiff.weight,
                new MovePropertyOperation(
                    {v1: [...pathP1, v1[0]], v2: [...pathP2, v2[0]]},
                    {v1: v1[1], v2: v2[1]},
                    (propDiff.operation as UpdatePropertyOperation)?.innerOperations
            ));
        });

        const removedDiffs = renamedDiffMatchResults.unmatchedA.map(([k]) => new PropertyDiff(
            0, PropertyDiff.calcPropertyWeight(a[k]), new RemovePropertyOperation({v1: [...pathP1, k]}, {v1: a[k]})));
        const insertedDiffs = renamedDiffMatchResults.unmatchedB.map(([k]) => new PropertyDiff(
            0, PropertyDiff.calcPropertyWeight(b[k]), new InsertPropertyOperation({v1: [...pathP2, k]}, {v2: b[k]})));
                
        return PropertyDiff.fromCollectionDiffs(p1, p2, [...sameNameDiffs, ...renamedDiffs, ...removedDiffs, ...insertedDiffs], pathP1, pathP2);
    }
    
    private static fromArrayProperties = (
        p1: ComponentProperty,
        p2: ComponentProperty,
        pathP1: Array<string | number>,
        pathP2: Array<string | number>,
    ) => {
        const [a, b] = [p1,p2].map(p => p.getArray());
        
        const matcherResults = new ComponentPropertiesMatcher(
            a.map((e,i) => [i,e]),
            b.map((e,i) => [i,e]),
            pathP1, pathP2
        ).match();
        
        const matchedDiffs = matcherResults.matches.map(({transition: {v1, v2}, metadata: propDiff}) => 
            v1 && v2 && v1[0] === v2[0]
                ? new PropertyDiff(
                        propDiff.similarity,
                        propDiff.weight,
                        new MovePropertyOperation(
                            {v1: [...pathP1, v1[0]], v2: [...pathP2, v2[0]]},
                            {v1: v1[1], v2: v2[1]},
                            (propDiff.operation as UpdatePropertyOperation)?.innerOperations
                        )
                    )    
                : propDiff
        ).filter(isDefined);
        
        const removedDiffs = matcherResults.unmatchedA.map(([i, e]) =>
            new PropertyDiff(0, PropertyDiff.calcPropertyWeight(e), new RemovePropertyOperation({v1: [...pathP1, i]}, {v1: e})));

        const insertedDiffs = matcherResults.unmatchedB.map(([i, e]) => 
            new PropertyDiff(0, PropertyDiff.calcPropertyWeight(e), new InsertPropertyOperation({v2: [...pathP2, i]}, {v2: e})));
    
        return PropertyDiff.fromCollectionDiffs(p1, p2, [...matchedDiffs, ...insertedDiffs, ...removedDiffs], pathP1, pathP2);
    };
    
    private static fromCollectionDiffs (
        p1: ComponentProperty,
        p2: ComponentProperty,
        innerDiffs: PropertyDiff[],
        pathP1: Array<string | number>,
        pathP2: Array<string | number>
    ) {
        const totalWeight = innerDiffs.reduce((total, s) => total + s.weight, 0);
        if(totalWeight === 0)
            return new PropertyDiff(1, 0);
        const score = innerDiffs.reduce((acc, s) => acc + s.similarity * s.weight, 0) / totalWeight;
    
        const innerOperations = innerDiffs.map(diff => diff.operation).filter(isDefined);
    
        let operation;
        if(innerOperations.length > 1){
            operation = new UpdatePropertyOperation({v1: pathP1, v2: pathP2}, {v1: p1, v2: p2}, innerOperations);
        } else if(innerOperations.length == 1){
            operation = innerOperations[0];
        }
    
        return new PropertyDiff(score, totalWeight, operation);
    }
    
    private static fromPrimitives(
        p1: ComponentProperty,
        p2: ComponentProperty,
        pathP1: Array<string | number>,
        pathP2: Array<string | number>
    ) {
        const similarity = 
            typeof p1.value === 'string' && typeof p2.value === 'string'
                ? stringSimilarity(p1.value, p2.value)
                : (p1.value === p2.value ? 1 : 0);

        let operation;
        if(similarity !== 1)
            operation = new UpdatePropertyOperation({v1: pathP1, v2: pathP2}, {v1: p1, v2: p2});
    
        return new PropertyDiff(similarity, 1, operation);
    }
    
    private static fromDifferentProperties(
        p1: ComponentProperty,
        p2: ComponentProperty,
        pathP1: Array<string | number>,
        pathP2: Array<string | number>
    ) {
        let operation;
        if(p1 === undefined && p2 !== undefined){
            operation = new InsertPropertyOperation({v2: pathP2}, {v2: p1});
        } else if (p1 !== undefined && p2 === undefined){
            operation = new RemovePropertyOperation({v1: pathP1}, {v1: p1});
        }
    
        return new PropertyDiff(
            0,
            (PropertyDiff.calcPropertyWeight(p1) + PropertyDiff.calcPropertyWeight(p2)),
            operation
        );
    }
    
    private static calcPropertyWeight (obj: ComponentProperty): number {
        if(obj instanceof ComponentPropertyPrimitive)
            return 1;
        else if(obj instanceof ComponentPropertyCollection && typeof obj.value === 'object'){
            return Object.values(obj.value).reduce((weight, p) => weight + PropertyDiff.calcPropertyWeight(p), 0);
        }
        return 0;
    }
}

