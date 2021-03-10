export function isDefined<A>(x: A): x is NonNullable<A> {
    return x !== undefined;
}