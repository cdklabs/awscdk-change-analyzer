import { groupArrayBy } from "change-cd-iac-models/utils";
import { Aggregation } from "change-cd-iac-models/aggregations";

/**
 * Defines an Isomorphic Group
 */
export abstract class AggModule<T> {
    constructor(
        public readonly label: string
    ){}

    public abstract extractGroups(entities: Set<T>): Aggregation<T>[];
}

/**
 * Defines an Isomorphic group module that groups entities based on
 * an indexable value (obtained using indexValueGetter)
 */
export class EqualityAggModule<T> extends AggModule<T> {
    constructor(
        label: string,
        public readonly indexValueGetter: (e: T) => string | number | boolean | undefined
    ){super(label);}

    extractGroups(entities: Set<T>): Aggregation<T>[] {
        return [...groupArrayBy([...entities], this.indexValueGetter)].map(([key, ops]) => ({
            entities: new Set(ops),
            characteristics: {
                [this.label]: key
            }
        }));
    }
}

/**
 * Defines an Isomorphic group module that groups entities based on
 * similarity between each pair of entities (obtained using similarityChecker)
 */
export class SimilarityAggModule<T> extends AggModule<T> {
    constructor(
        label: string,
        public readonly similarityChecker: (e: T) => boolean
    ){super(label);}

    extractGroups(): Aggregation<T>[] {
        throw Error("Similarity Agg Module does not have an implementation yet");
    }
}