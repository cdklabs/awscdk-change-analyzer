export const flattenObjects = (objects: Record<any, any>[]): Record<any, any> => {
  return objects.reduce((acc, object) =>
    ({...acc, ...object}));
};

export const mapObjectValues = <T, R>(object: Record<any, T>, cb: (v: T, i: number) => R): R[] => {
  return Object.values(object).map(cb);
};

/**
 * Merges objects with array values through concatenation.
 *
 * @param objects The object to merge
 */
export function mergeObjects<T>(...objects: {[key: string]: T[]}[]): {[key: string]: T[]} {
  const target: {[key: string]: T[]}  = {};
  objects.forEach(source =>
    Object.entries(source).forEach(([key, values]) => {
      target[key] = key in target ? [...target[key], ...values] : values;
    }),
  );
  return target;
}

/**
 * Returns a deep copy of an object.
 *
 * @param source The source object to copy
 */
export function copy<T>(source: T): T{
  if (typeof source !== 'object' || source === null) {
    return source;
  }
  if (Array.isArray(source)) {
    return copyArray(source);
  }
  return copyObject(source);
}

function copyArray<T extends any[]>(source: T): T {
  return source.map((value) => copy(value)) as T;
}

function copyObject<T>(source: T): T {
  return Object.entries(source).reduce((acc, [key, value]) => ({
    ...acc, [key]: copy(value),
  }), {}) as T;
}