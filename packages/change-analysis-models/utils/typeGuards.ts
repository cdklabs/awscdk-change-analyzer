// TODO: Remove this as it is a duplicate of fifinet/utils
// once fifinet 0.1.5 is published
export function isDefined<A>(x: A): x is NonNullable<A> {
    return x !== undefined;
}