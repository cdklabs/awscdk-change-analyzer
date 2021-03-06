export interface Transition<T> {
    v1?: T,
    v2?: T,
}

export interface CompleteTransition<T> extends Transition<T> {
    v1: T,
    v2: T
}