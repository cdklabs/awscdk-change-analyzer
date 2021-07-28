function looksLikeCfnIntrinsic(object: any): string | undefined {
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
  };

  const searchReferences = (token: string) =>
    references.find(({ ParameterKey }) => ParameterKey === token)?.ParameterValue;

  switch(key) {
    case undefined:
      return undefined;
    case 'Ref': {
      const token: string = property[key] ?? '';
      return searchReferences(token);
    }
    case 'Fn::Split': {
      const splitItems = property[key] ?? [];
      const [splitDelimiter, source] = resolve(splitItems);
      return source.split(splitDelimiter);
    }
    case 'Fn::Select': {
      const selectItems = property[key] ?? [];
      const [index, resolvedItems] = resolve(selectItems);
      return resolvedItems[index];
    }
    case 'Fn::Join': {
      const [joinDelimiter, values] = property[key] ?? [];
      const resolvedValues = resolve(values);
      return resolvedValues.join(joinDelimiter);
    }
    case 'Fn::Sub': {
      const [unresolvedString, unresolvedSubstitutes] = typeof(property[key]) === 'string'
        ? [property[key], undefined]
        : property[key];

      const substitutes: {[k: string]: string} = Object.entries(unresolvedSubstitutes ?? {}).reduce(
        (acc, [k, value]) => ({...acc, [k]: resolveCfnProperty(value, references) ?? value }), {});

      const search = (ref: string): string => {
        return substitutes[ref] ?? searchReferences(ref) ?? `\${${ref}}`;
      };

      return (unresolvedString as string).replace(/\$\{([^}]*)\}/g, (_, m) => {
        return search(m);
      });
    }
    default:
      throw new Error(`Unsupported CloudFormation Intrinsic Function: ${key}`);
  }
}