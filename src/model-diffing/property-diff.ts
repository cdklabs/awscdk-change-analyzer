import { Component, ComponentProperty, ComponentPropertyArray, ComponentCollectionProperty, ComponentPropertyPrimitive, ComponentPropertyRecord, EmptyComponentProperty } from "../infra-model";
import { arrayIntersection, isDefined, stringSimilarity } from '../utils';
import { propertySimilarityEvaluatorCreator } from "./entity-matchers/component-properties-matcher";
import { matchEntities } from "./entity-matchers/entities-matcher";
import { InsertPropertyComponentOperation, PropertyComponentOperation, RemovePropertyComponentOperation, UpdatePropertyComponentOperation, MovePropertyComponentOperation } from "./operations";
import { Transition } from "./transition";

/**
 * Describes how two ComponentProperties differ
 */
export interface PropertyDiff {
    readonly similarity: number,
    readonly weight: number,
    readonly operation?: PropertyComponentOperation,
}

const propertySimilarityThreshold = 0.5;

/**
 * Creates the PropertyDiff between two properties of a given Transition<Component>.
 */
export class PropertyDiffCreator {

    constructor(
        private readonly componentTransition: Transition<Component>
    ) {
        if(!this.componentTransition.v1 || !this.componentTransition.v2)
            throw Error("Cannot diff Properties of Transition<Component> with undefined version");
    }

    public create(p1: ComponentProperty, p2: ComponentProperty, basePathP1: Array<string | number> = [], basePathP2 = basePathP1): PropertyDiff {
        if(p1 instanceof ComponentPropertyRecord && p2 instanceof ComponentPropertyRecord){
            return this.fromRecordProperties(p1, p2, basePathP1, basePathP2);
        } else if(p1 instanceof ComponentPropertyArray && p2 instanceof ComponentPropertyArray){
            return this.fromArrayProperties(p1, p2, basePathP1, basePathP2);
        } else if(p1 instanceof ComponentPropertyPrimitive && p2 instanceof ComponentPropertyPrimitive){
            return this.fromPrimitives(p1, p2, basePathP1, basePathP2);
        } else if(p1 instanceof EmptyComponentProperty && p2 instanceof EmptyComponentProperty) {
            return {similarity:1, weight: 0};
        }
        return this.fromDifferentProperties(p1, p2, basePathP1, basePathP2);
    }

    private fromRecordProperties(
        p1: ComponentProperty,
        p2: ComponentProperty,
        pathP1: Array<string | number>,
        pathP2: Array<string | number>,
    ): PropertyDiff {
        const [a, b] = [p1,p2].map(p => p.getRecord());
        
        const sameNameKeys = arrayIntersection(Object.keys(a), Object.keys(b));
        const pickedSameNames = sameNameKeys
            .map((k): [string, PropertyDiff] => [k, this.create(a[k], b[k], [...pathP1, k], [...pathP2, k])])
            .filter(([, pd]) => pd.similarity >= propertySimilarityThreshold);

        const pickedSameNameKeys = new Set(pickedSameNames.map(([k]) => k));
        const sameNameDiffs = pickedSameNames.map(([, pd]) => pd);

        const renamedDiffMatchResults = matchEntities(
            Object.entries(a).filter(([k]) => !pickedSameNameKeys.has(k)),
            Object.entries(b).filter(([k]) => !pickedSameNameKeys.has(k)),
            propertySimilarityEvaluatorCreator(
                this.componentTransition,
                pathP1, pathP2
            ),
            propertySimilarityThreshold
        );
        
        const renamedDiffs = renamedDiffMatchResults.matches.map(({transition: {v1, v2}, metadata: propDiff}) => {
            if(!v1 || !v2)
                throw Error("Entity matching returned undefined versions");
            return {
                similarity: propDiff.similarity,
                weight: propDiff.weight,
                operation: new MovePropertyComponentOperation(
                    {v1: [...pathP1, v1[0]], v2: [...pathP2, v2[0]]},
                    {v1: v1[1], v2: v2[1]},
                    this.componentTransition,
                    {},
                    (propDiff.operation as UpdatePropertyComponentOperation)?.innerOperations
            )};
        });

        const removedDiffs = renamedDiffMatchResults.unmatchedA.map(([k]) => ({
            similarity: 0,
            weight: this.calcPropertyWeight(a[k]),
            operation: new RemovePropertyComponentOperation({v1: [...pathP1, k]}, {v1: a[k]}, this.componentTransition)
        }));
        const insertedDiffs = renamedDiffMatchResults.unmatchedB.map(([k]) => ({
            similarity: 0,
            weight: this.calcPropertyWeight(b[k]),
            operation: new InsertPropertyComponentOperation({v1: [...pathP2, k]}, {v2: b[k]}, this.componentTransition)
        }));
                
        return this.fromCollectionDiffs(p1, p2, [...sameNameDiffs, ...renamedDiffs, ...removedDiffs, ...insertedDiffs], pathP1, pathP2);
    }
    
    private fromArrayProperties = (
        p1: ComponentProperty,
        p2: ComponentProperty,
        pathP1: Array<string | number>,
        pathP2: Array<string | number>,
    ) => {
        const [a, b] = [p1,p2].map(p => p.getArray());
        
        const matcherResults = matchEntities(
            a.map((e,i): [number, ComponentProperty] => [i,e]),
            b.map((e,i): [number, ComponentProperty] => [i,e]),
            propertySimilarityEvaluatorCreator(
                this.componentTransition,
                pathP1, pathP2
            ),
            propertySimilarityThreshold
        );
        
        const matchedDiffs = matcherResults.matches.map(({transition: {v1, v2}, metadata: propDiff}) => 
            v1 && v2 && v1[0] === v2[0]
                ? {
                    similarity: propDiff.similarity,
                    weight: propDiff.weight,
                    operation: new MovePropertyComponentOperation(
                        {v1: [...pathP1, v1[0]], v2: [...pathP2, v2[0]]},
                        {v1: v1[1], v2: v2[1]},
                        this.componentTransition,
                        {},
                        (propDiff.operation as UpdatePropertyComponentOperation)?.innerOperations
                    )
                }    
                : propDiff
        ).filter(isDefined);
        
        const removedDiffs = matcherResults.unmatchedA.map(([i, e]) => ({
                similarity: 0,
                weight: this.calcPropertyWeight(e),
                operation: new RemovePropertyComponentOperation({v1: [...pathP1, i]}, {v1: e}, this.componentTransition)
        }));

        const insertedDiffs = matcherResults.unmatchedB.map(([i, e]) => ({
            similarity: 0,
            weight: this.calcPropertyWeight(e),
            operation: new InsertPropertyComponentOperation({v2: [...pathP2, i]}, {v2: e}, this.componentTransition)
        }));
    
        return this.fromCollectionDiffs(p1, p2, [...matchedDiffs, ...insertedDiffs, ...removedDiffs], pathP1, pathP2);
    };
    
    private fromCollectionDiffs (
        p1: ComponentProperty,
        p2: ComponentProperty,
        innerDiffs: PropertyDiff[],
        pathP1: Array<string | number>,
        pathP2: Array<string | number>
    ) {
        const totalWeight = innerDiffs.reduce((total, s) => total + s.weight, 0);
        if(totalWeight === 0)
            return {similarity:1, weight: 0};
        const score = innerDiffs.reduce((acc, s) => acc + s.similarity * s.weight, 0) / totalWeight;
    
        const innerOperations = innerDiffs.map(diff => diff.operation).filter(isDefined);
    
        let operation;
        if(innerOperations.length > 1){
            operation = new UpdatePropertyComponentOperation({v1: pathP1, v2: pathP2}, {v1: p1, v2: p2}, this.componentTransition, {}, innerOperations);
        } else if(innerOperations.length == 1){
            operation = innerOperations[0];
        }
    
        return {similarity: score, weight: totalWeight, operation};
    }
    
    private fromPrimitives(
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
            operation = new UpdatePropertyComponentOperation({v1: pathP1, v2: pathP2}, {v1: p1, v2: p2}, this.componentTransition);
                
        return {similarity, weight: 1, operation};
    }
    
    private fromDifferentProperties(
        p1: ComponentProperty,
        p2: ComponentProperty,
        pathP1: Array<string | number>,
        pathP2: Array<string | number>
    ) {
        let operation;
        if(p1 === undefined && p2 !== undefined){
            operation = new InsertPropertyComponentOperation({v2: pathP2}, {v2: p1}, this.componentTransition);
        } else if (p1 !== undefined && p2 === undefined){
            operation = new RemovePropertyComponentOperation({v1: pathP1}, {v1: p1}, this.componentTransition);
        }
    
        return {
            similarity: 0,
            weight: (this.calcPropertyWeight(p1) + this.calcPropertyWeight(p2)),
            operation
        };
    }
    
    private calcPropertyWeight (obj: ComponentProperty): number {
        if(obj instanceof ComponentPropertyPrimitive)
            return 1;
        else if(obj instanceof ComponentCollectionProperty && typeof obj.value === 'object'){
            return Object.values(obj.value).reduce((weight, p) => weight + this.calcPropertyWeight(p), 0);
        }
        return 0;
    }
}

