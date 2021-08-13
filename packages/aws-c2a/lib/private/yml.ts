import * as fs from 'fs';
import * as yaml from 'yaml';
import * as yaml_cst from 'yaml/parse-cst';
import * as yaml_types from 'yaml/types';

/**
 * Deserialize the YAML into the appropriate data structure.
 *
 * @param str the string containing YAML
 * @returns the data structure the YAML represents
 *   (most often in case of CloudFormation, an object)
 */
export function deserialize(str: string): any {
  return parseYamlStrWithCfnTags(str);
}

function makeTagForCfnIntrinsic(intrinsicName: string, addFnPrefix: boolean): yaml_types.Schema.CustomTag {
  return {
    identify(value: any) { return typeof value === 'string'; },
    tag: `!${intrinsicName}`,
    resolve: (_doc: yaml.Document, cstNode: yaml_cst.CST.Node) => {
      const ret: any = {};
      ret[addFnPrefix ? `Fn::${intrinsicName}` : intrinsicName] =
        // the +1 is to account for the ! the short form begins with
        parseYamlStrWithCfnTags(cstNode.toString().substring(intrinsicName.length + 1));
      return ret;
    },
  };
}

const shortForms: yaml_types.Schema.CustomTag[] = [
  'Base64', 'Cidr', 'FindInMap', 'GetAZs', 'ImportValue', 'Join', 'Sub',
  'Select', 'Split', 'Transform', 'And', 'Equals', 'If', 'Not', 'Or', 'GetAtt',
].map(name => makeTagForCfnIntrinsic(name, true)).concat(
  makeTagForCfnIntrinsic('Ref', false),
  makeTagForCfnIntrinsic('Condition', false),
);

function parseYamlStrWithCfnTags(text: string): any {
  return yaml.parse(text, {
    customTags: shortForms,
    schema: 'core',
  });
}


/**
 * Parse either YAML or JSON
 */
export function deserializeStructure(str: string): any {
  try {
    return deserialize(str);
  } catch (e) {
    // This shouldn't really ever happen I think, but it's the code we had so I'm leaving it.
    return JSON.parse(str);
  }
}

/**
 * Load a YAML or JSON file from disk
 */
export async function loadStructuredFile(fileName: string): Promise<any> {
  const contents = await fs.promises.readFile(fileName, { encoding: 'utf-8' });
  return deserializeStructure(contents);
}
