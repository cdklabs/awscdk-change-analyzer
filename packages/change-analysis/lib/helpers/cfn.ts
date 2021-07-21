function looksLikeCfnIntrinsic(object: object): string | undefined {
  const objectKeys = Object.keys(object);
  // a CFN intrinsic is always an object with a single key
  if (objectKeys.length !== 1) {
    return undefined;
  }

  const key = objectKeys[0];
  return key === 'Ref' || key.startsWith('Fn::')
    ? key
    : undefined;
}

export function resolveCfnProperty(property: any, references: AWS.CloudFormation.Parameters): string | undefined {
  const key = looksLikeCfnIntrinsic(property);

  const resolve = (items: any[]) => {
    return items.map((item: any) => resolveCfnProperty(item, references) ?? item);
  }

  switch(key) {
    case undefined:
      return undefined;
    case 'Ref':
      const token: string = property[key] ?? '';
      return references.find(({ ParameterKey }) => ParameterKey === token)?.ParameterValue;
    case 'Fn::Split':
      const splitItems = property[key] ?? [];
      const [splitDelimiter, source] = resolve(splitItems);
      return source.split(splitDelimiter);
    case 'Fn::Select':
      const selectItems = property[key] ?? [];
      const [index, resolvedItems] = resolve(selectItems);
      return resolvedItems[index];
    case 'Fn::Join':
      const [joinDelimiter, values] = property[key] ?? [];
      const resolvedValues = resolve(values);
      return resolvedValues.join(joinDelimiter);
    default:
      throw new Error(`Unsupported CloudFormation Intrinsic Function: ${key}`);
  }
}