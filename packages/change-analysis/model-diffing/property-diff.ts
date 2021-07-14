import {
  Component,
  ComponentPropertyValue,
  ComponentPropertyArray,
  ComponentCollectionProperty,
  ComponentPropertyPrimitive,
  ComponentPropertyRecord,
  EmptyComponentProperty,
  Transition,
  InsertPropertyComponentOperation,
  PropertyComponentOperation,
  RemovePropertyComponentOperation,
  UpdatePropertyComponentOperation,
  MovePropertyComponentOperation,
  arrayIntersection, isDefined, stringSimilarity,
} from 'cdk-change-analyzer-models';
import { propertySimilarityEvaluatorCreator } from './entity-matchers/component-properties-matcher';
import { matchEntities } from './entity-matchers/entities-matcher';

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
    private readonly componentTransition: Transition<Component>,
  ) {
    if(!this.componentTransition.v1 || !this.componentTransition.v2)
      throw Error('Cannot diff Properties of Transition<Component> with undefined version');

  }

  public create(
    p1: ComponentPropertyValue,
    p2: ComponentPropertyValue,
    basePathP1: Array<string | number> = [],
    basePathP2 = basePathP1,
  ): PropertyDiff {
    if(p1 instanceof ComponentPropertyRecord && p2 instanceof ComponentPropertyRecord){
      return this.fromRecordProperties(p1, p2, basePathP1, basePathP2);
    } else if(p1 instanceof ComponentPropertyArray && p2 instanceof ComponentPropertyArray){
      return this.fromArrayProperties(p1, p2, basePathP1, basePathP2);
    } else if(p1 instanceof ComponentPropertyPrimitive && p2 instanceof ComponentPropertyPrimitive){
      return this.fromPrimitives(p1, p2, basePathP1, basePathP2);
    } else if(p1 instanceof EmptyComponentProperty && p2 instanceof EmptyComponentProperty) {
      return {similarity: 1, weight: 0};
    }
    return this.fromDifferentProperties(p1, p2, basePathP1, basePathP2);
  }

  private fromRecordProperties(
    p1: ComponentPropertyValue,
    p2: ComponentPropertyValue,
    pathP1: Array<string | number>,
    pathP2: Array<string | number>,
  ): PropertyDiff {
    const [p1Record, p2Record] = [p1,p2].map(p => p.getRecord());

    const sameNameKeys = arrayIntersection(Object.keys(p1Record), Object.keys(p2Record));

    const pickedSameNames: [string, PropertyDiff][] = sameNameKeys
      .map((k): [string, PropertyDiff] => [k, this.create(p1Record[k], p2Record[k], [...pathP1, k], [...pathP2, k])])
      .map(([k, pd]): [string, PropertyDiff] => [k, {
        ...pd,
        similarity: pd.similarity + (1 - pd.similarity)*(1/(pd.weight+1)), // keys impact similiarity as much as string values
        weight: pd.weight + 1,
      }]);

    const pickedSameNameKeys = new Set(pickedSameNames.map(([k]) => k));
    const sameNameDiffs = pickedSameNames.map(([, pd]) => pd);

    const renamedDiffMatchResults = matchEntities<string, PropertyDiff>(
      Object.keys(p1Record).filter((k) => !pickedSameNameKeys.has(k)),
      Object.keys(p2Record).filter((k) => !pickedSameNameKeys.has(k)),
      propertySimilarityEvaluatorCreator(
        this.componentTransition,
        p1Record, p2Record, pathP1, pathP2,
      ),
      propertySimilarityThreshold,
    );

    const renamedDiffs = renamedDiffMatchResults.matches.map(({transition: {v1, v2}, metadata: propDiff}) => {
      if(!v1 || !v2)
        throw Error('Entity matching returned undefined versions');
      return {
        similarity: propDiff.similarity,
        weight: propDiff.weight,
        operation: new MovePropertyComponentOperation({}, {
          pathTransition: new Transition({v1: [...pathP1, v1[0]], v2: [...pathP2, v2[0]]}),
          propertyTransition: new Transition({v1: p1Record[v1], v2: p2Record[v2]}),
          componentTransition: this.componentTransition,
          innerOperations: (propDiff.operation as UpdatePropertyComponentOperation)?.innerOperations,
        }),
      };
    });

    const removedDiffs = renamedDiffMatchResults.unmatchedA.map((k) => ({
      similarity: 0,
      weight: this.calcPropertyWeight(p1Record[k]),
      operation: new RemovePropertyComponentOperation(
        {},
        {
          pathTransition: new Transition({v1: [...pathP1, k]}),
          propertyTransition: new Transition({v1: p1Record[k]}),
          componentTransition: this.componentTransition,
        }),
    }));
    const insertedDiffs = renamedDiffMatchResults.unmatchedB.map((k) => ({
      similarity: 0,
      weight: this.calcPropertyWeight(p2Record[k]),
      operation: new InsertPropertyComponentOperation(
        {},
        {
          pathTransition: new Transition({v2: [...pathP2, k]}),
          propertyTransition: new Transition({v2: p2Record[k]}),
          componentTransition: this.componentTransition,
        }),
    }));

    return this.fromCollectionDiffs(
      p1,
      p2,
      [...sameNameDiffs, ...renamedDiffs, ...removedDiffs, ...insertedDiffs],
      pathP1,
      pathP2);
  }

  private fromArrayProperties = (
    p1: ComponentPropertyValue,
    p2: ComponentPropertyValue,
    pathP1: Array<string | number>,
    pathP2: Array<string | number>,
  ) => {
    const [p1Array, p2Array] = [p1,p2].map(p => p.getArray());

    const matcherResults = matchEntities(
      p1Array.map((_,i) => i),
      p2Array.map((_,i) => i),
      propertySimilarityEvaluatorCreator(
        this.componentTransition,
        Object.fromEntries(p1Array.map((e, i) => [i, e])),
        Object.fromEntries(p2Array.map((e, i) => [i, e])),
        pathP1, pathP2,
      ),
      propertySimilarityThreshold,
    );

    const matchedDiffs = matcherResults.matches.map(({transition: {v1, v2}, metadata: propDiff}) =>
      v1 && v2 && v1 !== v2
        ? {
          similarity: propDiff.similarity,
          weight: propDiff.weight,
          operation: new MovePropertyComponentOperation({}, {
            pathTransition: new Transition({v1: [...pathP1, v1], v2: [...pathP2, v2]}),
            propertyTransition: new Transition({v1: p1Array[v1], v2: p2Array[v2]}),
            componentTransition: this.componentTransition,
            innerOperations: (propDiff.operation as UpdatePropertyComponentOperation)?.innerOperations,
          }),
        }
        : propDiff,
    ).filter(isDefined);

    const removedDiffs = matcherResults.unmatchedA.map((i) => ({
      similarity: 0,
      weight: this.calcPropertyWeight(p1Array[i]),
      operation: new RemovePropertyComponentOperation(
        {},
        {
          pathTransition: new Transition({v1: [...pathP1, i]}),
          propertyTransition: new Transition({v1: p1Array[i]}),
          componentTransition: this.componentTransition,
        }),
    }));

    const insertedDiffs = matcherResults.unmatchedB.map((i) => ({
      similarity: 0,
      weight: this.calcPropertyWeight(p2Array[i]),
      operation: new InsertPropertyComponentOperation(
        {},
        {
          pathTransition: new Transition({v2: [...pathP2, i]}),
          propertyTransition: new Transition({v2: p2Array[i]}),
          componentTransition: this.componentTransition,
        }),
    }));

    return this.fromCollectionDiffs(p1, p2, [...matchedDiffs, ...insertedDiffs, ...removedDiffs], pathP1, pathP2);
  };

  private fromCollectionDiffs (
    p1: ComponentPropertyValue,
    p2: ComponentPropertyValue,
    innerDiffs: PropertyDiff[],
    pathP1: Array<string | number>,
    pathP2: Array<string | number>,
  ) {
    const totalWeight = innerDiffs.reduce((total, s) => total + s.weight, 0);
    if(totalWeight === 0)
      return {similarity: 1, weight: 0};
    const score = innerDiffs.reduce((acc, s) => acc + s.similarity * s.weight, 0) / totalWeight;

    const innerOperations = innerDiffs.map(diff => diff.operation).filter(isDefined);

    let operation;
    if(innerOperations.length > 0){
      operation = new UpdatePropertyComponentOperation({}, {
        pathTransition: new Transition({v1: pathP1, v2: pathP2}),
        propertyTransition: new Transition({v1: p1, v2: p2}),
        componentTransition: this.componentTransition,
        innerOperations,
      });
    }

    return {similarity: score, weight: totalWeight, operation};
  }

  private fromPrimitives(
    p1: ComponentPropertyValue,
    p2: ComponentPropertyValue,
    pathP1: Array<string | number>,
    pathP2: Array<string | number>,
  ) {

    const similarity =
            typeof p1.value === 'string' && typeof p2.value === 'string'
              ? stringSimilarity(p1.value, p2.value)
              : (p1.value === p2.value ? 1 : 0);

    let operation;
    if(similarity !== 1)
      operation = new UpdatePropertyComponentOperation({}, {
        pathTransition: new Transition({v1: pathP1, v2: pathP2}),
        propertyTransition: new Transition({v1: p1, v2: p2}),
        componentTransition: this.componentTransition,
      });

    return {similarity, weight: 2, operation};
  }

  private fromDifferentProperties(
    p1: ComponentPropertyValue,
    p2: ComponentPropertyValue,
    pathP1: Array<string | number>,
    pathP2: Array<string | number>,
  ) {
    let operation;
    if(p1 === undefined && p2 !== undefined){
      operation = new InsertPropertyComponentOperation(
        {},
        {
          pathTransition: new Transition({v2: pathP2}),
          propertyTransition: new Transition({v2: p2}),
          componentTransition: this.componentTransition,
        });
    } else if (p1 !== undefined && p2 === undefined){
      operation = new RemovePropertyComponentOperation(
        {},
        {
          pathTransition: new Transition({v1: pathP1}),
          propertyTransition: new Transition({v1: p1}),
          componentTransition: this.componentTransition,
        });
    } else {
      operation = new UpdatePropertyComponentOperation({}, {
        pathTransition: new Transition({v1: pathP1, v2: pathP2}),
        propertyTransition: new Transition({v1: p1, v2: p2}),
        componentTransition: this.componentTransition,
      });
    }

    return {
      similarity: 0,
      weight: (this.calcPropertyWeight(p1) + this.calcPropertyWeight(p2)),
      operation,
    };
  }

  private calcPropertyWeight (obj: ComponentPropertyValue): number {
    if(obj instanceof ComponentPropertyPrimitive)
      return 1;
    else if(obj instanceof ComponentCollectionProperty && typeof obj.value === 'object'){
      return Object.values(obj.value).reduce((weight, p) => weight + this.calcPropertyWeight(p), 0);
    }
    return 0;
  }
}

