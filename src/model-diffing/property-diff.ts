import { ComponentProperty, ComponentPropertyArray, ComponentPropertyCollection, ComponentPropertyPrimitive, ComponentPropertyRecord, EmptyComponentProperty } from "../infra-model";
import { isDefined, stringSimilarity } from '../utils';
import { InsertPropertyOperation, PropertyOperation, RemovePropertyOperation, UpdatePropertyOperation } from "./operations";

/**
 * Describes how two ComponentProperties differ
 */
export class PropertyDiff {

    public static fromProperties(p1: ComponentProperty, p2: ComponentProperty): PropertyDiff{
        return PropertyDiff.fromPropertiesAux(p1, p2);
    }

    private constructor(
        public readonly similarity: number,
        public readonly weight: number,
        public readonly operation?: PropertyOperation,
    ){}

    private static fromPropertiesAux(p1: ComponentProperty, p2: ComponentProperty, path: Array<string | number> = []): PropertyDiff {
        if(p1 instanceof ComponentPropertyRecord && p2 instanceof ComponentPropertyRecord){
            return PropertyDiff.fromRecords(p1.getRecord(), p2.getRecord(), path);
        } else if(p1 instanceof ComponentPropertyArray && p2 instanceof ComponentPropertyArray){
            return PropertyDiff.fromArrays(p1.getArray(), p2.getArray(), path);
        } else if(p1 instanceof ComponentPropertyPrimitive && p2 instanceof ComponentPropertyPrimitive){
            if(typeof p1.value === 'string' && typeof p2.value === 'string')
                return PropertyDiff.fromPrimitivesSimilarity(stringSimilarity(p1.value, p2.value), path);
            if(typeof p1.value === 'number' && typeof p2.value === 'number')
                return PropertyDiff.fromPrimitivesSimilarity(p1.value === p2.value ? 1 : 0, path);
        } else if(p1 instanceof EmptyComponentProperty && p2 instanceof EmptyComponentProperty) {
            return new PropertyDiff(1, 0);
        }
        return PropertyDiff.fromDifferentProperties(p1, p2, path);
    }

    private static fromRecords(a: Record<string, ComponentProperty>, b: Record<string, ComponentProperty>, path: Array<string | number>): PropertyDiff {
        const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
    
        const innerDiffs = keys.map((key) => {
                return PropertyDiff.fromPropertiesAux(a[key], b[key], [...path, key]);
        });
    
        return PropertyDiff.fromCollectionDiffs(innerDiffs, path);
    }
    
    private static fromArrays = (a: ComponentProperty[], b: ComponentProperty[], path: Array<string | number>) => {
        const removedElements = a.length > b.length;
        const [smaller, larger] = removedElements ? [b,a] : [a,b];
        
        const innerDiffs = [
            ...smaller.map((p, i) => PropertyDiff.fromPropertiesAux(p, larger[i], [...path, i])),
            ...larger.slice(smaller.length).map((p, i) => new PropertyDiff(
                    0,
                    PropertyDiff.calcPropertyWeight(p),
                    removedElements
                        ? new RemovePropertyOperation([...path, smaller.length+i])
                        : new InsertPropertyOperation([...path, smaller.length+i])
            ))
        ];
    
        return PropertyDiff.fromCollectionDiffs(innerDiffs, path);
    };
    
    private static fromCollectionDiffs (innerDiffs: PropertyDiff[], path: Array<string | number>) {
        const totalWeight = innerDiffs.reduce((total, s) => total + s.weight, 0);
        if(totalWeight === 0)
            return new PropertyDiff(1, 0);
        const score = innerDiffs.reduce((acc, s) => acc + s.similarity * s.weight, 0) / totalWeight;
    
        const innerOperations = innerDiffs.map(diff => diff.operation).filter(isDefined);
    
        let operation;
        if(innerOperations.length > 1){
            operation = new UpdatePropertyOperation(path, innerOperations);
        } else if(innerOperations.length == 1){
            operation = innerOperations[0];
        }
    
        return new PropertyDiff(score, totalWeight, operation);
    }
    
    private static fromPrimitivesSimilarity (similarity: number, path: Array<string | number>) {
        let operation;
        if(similarity !== 1)
            operation = new UpdatePropertyOperation(path);
    
        return new PropertyDiff(similarity, 1, operation);
    }
    
    private static fromDifferentProperties(p1: ComponentProperty, p2: ComponentProperty, path: Array<string | number>) {
        let operation;
        if(p1 === undefined && p2 !== undefined){
            operation = new InsertPropertyOperation(path);
        } else if (p1 !== undefined && p2 === undefined){
            operation = new RemovePropertyOperation(path);
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

