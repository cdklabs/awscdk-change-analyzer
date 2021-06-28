export function setsEqual<T>(a: Set<T>, b: Set<T>): boolean {
    if(a.size !== b.size)
        return false;
    return ![...a].some((e) => !b.has(e));
}