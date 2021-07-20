
import { IC2AHost, TemplateTree } from "./toolkit";

export interface traverseStackOptions {
  readonly stackName: string;
  getTemplate: (s: string) => Promise<any>;
  recurse: (s: string, host: IC2AHost) => Promise<TemplateTree>;
}

async function traverseStack(options: traverseStackOptions, host: IC2AHost): Promise<TemplateTree> {
  const {stackName, getTemplate, recurse} = options;
  const template = await getTemplate(stackName);
  return {
    rootTemplate: template,
    nestedTemplates: await findNestedTemplates(template).reduce(async (templates, nested: string) => {
      return {...(await templates), [nested]: await recurse(nested, host)};
    }, {})
  };
}

export async function traverseS3(stackName: string, host: IC2AHost): Promise<TemplateTree> {
  return traverseStack({
    stackName,
    getTemplate: host.getS3Object,
    recurse: traverseS3,
  }, host);
}

export async function traverseCfn(stackName: string, host: IC2AHost): Promise<TemplateTree> {
  return traverseStack({
    stackName,
    getTemplate: host.getStackTemplate,
    recurse: traverseS3,
  }, host);
}

export async function traverseLocal(stackName: string, host: IC2AHost): Promise<TemplateTree> {
  return traverseStack({
    stackName,
    getTemplate: host.getLocalTemplate,
    recurse: traverseLocal,
  }, host);
}

export function findNestedTemplates(template: string): string[] {
  return MockTemplates[template] ?? [];
}

const MockTemplates: {[stackName: string]: string[]} = {
  'root': [
    'nested1',
    'nested2',
  ],
  'nested1': [
    'nested3',
  ],
  'nested2': [],
  'nested3': [
    'nested4',
  ],
  'nested4': [],
};