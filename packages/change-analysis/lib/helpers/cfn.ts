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

  const searchReferences = (token: string) =>
    references.find(({ ParameterKey }) => ParameterKey === token)?.ParameterValue;

  switch(key) {
    case undefined:
      return undefined;
    case 'Ref':
      const token: string = property[key] ?? '';
      return searchReferences(token);
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
    case 'Fn::Sub':
      const [unresolvedString, unresolvedSubstitutes] = typeof(property[key]) === 'string'
        ? [property[key], undefined]
        : property[key];

      const substitutes: {[key: string]: string} = Object.entries(unresolvedSubstitutes ?? {}).reduce(
        (acc, [key, value]) => ({...acc, [key]: resolveCfnProperty(value, references) ?? value }), {});
  
      const search = (ref: string): string | undefined => {
        return substitutes[ref] ?? searchReferences(ref) ?? ref;
      }

      let resolvingString: string = unresolvedString;
      while(/\${.*}/g.test(resolvingString)) {
        const startIdx = resolvingString.indexOf('${');
        const endIdx = resolvingString.indexOf('}', startIdx + 1);
        const substring = resolvingString.substring(startIdx, endIdx + 1);
        const replacement = search(substring.slice(2, -1));
        const regex = new RegExp(`\\${substring}`, 'g');
        resolvingString = resolvingString.replace(regex, `${replacement}`);
      }
      return resolvingString;
    default:
      throw new Error(`Unsupported CloudFormation Intrinsic Function: ${key}`);
  }
}