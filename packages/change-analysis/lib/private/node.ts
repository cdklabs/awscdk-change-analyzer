/**
 * Map a function over an array and concatenate the results
 */
 export function flatMap<T, U>(xs: T[], fn: ((x: T, i: number) => U[])): U[] {
  return flatten(xs.map(fn));
}

/**
 * Flatten a list of lists into a list of elements
 */
export function flatten<T>(xs: T[][]): T[] {
  return Array.prototype.concat.apply([], xs);
}

/**
 * Creates an object representing the given iterable
 * list of [key, value] pairs.
 */
export function fromEntries<T>(iterable: [string | number, T][]): {[key: string]: T}  {
  return [...iterable].reduce((obj, [key, val]) => {
    obj[key] = val
    return obj
  }, {} as {[key: string]: T});
}
