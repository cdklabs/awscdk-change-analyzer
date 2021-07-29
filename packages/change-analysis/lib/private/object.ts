export const flattenObjects = (objects: Record<any, any>[]) => {
  return objects.reduce((acc, object) =>
    ({...acc, ...object}));
};

export const mapObjectValues = <T, R>(object: Record<any, T>, cb: (v: T, i: number) => R) => {
  return Object.values(object).map(cb);
};