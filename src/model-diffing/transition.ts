/**
 * Represents two versions (v1 and v2) of an Entity
 */
export interface Transition<T> {
    v1?: T,
    v2?: T,
}

/**
 * Represents two versions (v1 and v2) of an Entity
 * where they both are defined
 */
export interface CompleteTransition<T> extends Transition<T> {
    v1: T,
    v2: T
}