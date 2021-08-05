/**
 * Map a function over an array and concatenate the results
 */
export function flatMap<T, U>(xs: T[], f: (x: T) => U[]): U[] {
  const ret = new Array<U>();
  for (const x of xs) {
    ret.push(...f(x));
  }
  return ret;
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
