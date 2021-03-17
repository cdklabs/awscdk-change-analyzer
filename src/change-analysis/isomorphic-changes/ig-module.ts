import { groupArrayBy } from "change-cd-iac-models/utils";
import { IsomorphicGroup } from "change-cd-iac-models/isomorphic-groups";

/**
 * Defines an Isomorphic Group
 */
export abstract class IGModule<T> {
    constructor(
        public readonly label: string
    ){}

    public abstract extractGroups(entities: Set<T>): IsomorphicGroup<T>[];
}

/**
 * Defines an Isomorphic group module that groups entities based on
 * an indexable value (obtained using indexValueGetter)
 */
export class EqualityIGModule<T> extends IGModule<T> {
    constructor(
        label: string,
        public readonly indexValueGetter: (e: T) => string | number | boolean | undefined
    ){super(label);}

    extractGroups(entities: Set<T>): IsomorphicGroup<T>[] {
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
export class SimilarityIGModule<T> extends IGModule<T> {
    constructor(
        label: string,
        public readonly similarityChecker: (e: T) => boolean
    ){super(label);}

    extractGroups(): IsomorphicGroup<T>[] {
        throw Error("Similarity IG Module does not have an implementation yet");
    }
}