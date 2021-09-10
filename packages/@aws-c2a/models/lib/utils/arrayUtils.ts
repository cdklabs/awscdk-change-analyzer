export function partitionArray<A>(arr: A[], isLeft: (x: A) => boolean): [A[], A[]] {
  return arr.reduce((acc, e) =>
    isLeft(e)
      ? [[...acc[0], e], acc[1]]
      : [acc[0], [...acc[1], e]],
  [[], []] as [A[], A[]]);
}

export function groupArrayBy<T, U>(arr: T[], propertyGetter: (t:T) => U): Map<U, T[]> {
  return arr.reduce((acc, e) => {
    const property = propertyGetter(e);
    return new Map([
      ...acc,
      [propertyGetter(e), [...(acc.get(property) ?? []), e]],
    ]);
  }, new Map() as Map<U, T[]>);
}

export function arrayIntersection<T>(a: T[], b: T[]): T[] {
  const aSet = new Set(a);
  return [...b.filter(k => aSet.has(k))];
}

export function arraysEqual<T>(a: T[], b:T[]): boolean {
  if(a.length !== b.length)
    return false;
  return !a.some((e, i) => e !== b[i]);
}