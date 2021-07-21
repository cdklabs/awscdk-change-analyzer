
import { resolveCfnProperty } from "./helpers/cfn";
import { IC2AHost, TemplateTree } from "./toolkit";

export async function traverseS3(stackName: string, host: IC2AHost): Promise<TemplateTree> {
  console.log('call s3');
  const {template} = await host.getS3Object(stackName);
  console.log(template);

  return {
    rootTemplate: template,
    nestedTemplates: await findNestedTemplates(template).reduce(async (templates, nested: string) => {
      return {...(await templates), [nested]: await traverseS3(nested, host)};
    }, {})
  };
}

export async function traverseCfn(stackName: string, host: IC2AHost): Promise<TemplateTree> {
  const {template, parameters} = await host.getCfnTemplate(stackName);

  return {
    rootTemplate: template,
    nestedTemplates: await findNestedTemplates(template, parameters).reduce(async (templates, nested: string) => {
      return {...(await templates), [nested]: await traverseS3(nested, host)};
    }, {})
  };
}

export async function traverseLocal(stackName: string, host: IC2AHost): Promise<TemplateTree> {
  const {template} = await host.getLocalTemplate(stackName);

  return {
    rootTemplate: template,
    nestedTemplates: await findNestedTemplates(template).reduce(async (templates, nested: string) => {
      return {...(await templates), [nested]: await traverseS3(nested, host)};
    }, {})
  };
}

export function findNestedTemplates(template: any, parameters?: AWS.CloudFormation.Parameters): string[] {
  const resources = template.Resources;
  const nestedStacks = Object.values(resources)
    .filter((resource: any) => resource.Type === 'AWS::CloudFormation::Stack')
    .map((resource: any) => resolveCfnProperty(resource.Properties.TemplateURL, parameters ?? []));
  return nestedStacks.filter(stack => stack !== undefined) as string[];
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
