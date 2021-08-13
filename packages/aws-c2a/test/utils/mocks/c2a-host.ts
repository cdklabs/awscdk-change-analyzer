import { IC2AHost } from '../../../lib';

/**
 * A mock host used to test basic calls.
 */
export class MockHost implements IC2AHost {

  public async describeStackResources(_stackName: string): Promise<undefined> {
    return undefined;
  }
  public async describeCfnStack(_stackName: string): Promise<AWS.CloudFormation.Stack | undefined> {
    return undefined;
  }
  public async getCfnTemplate(stackName: string): Promise<any> {
    return {
      TemplateBody: `{ "name": "${stackName}" }`,
    };
  }

  public async getS3Object(url: string): Promise<any> {
    return {
      Body: `{ "name": "${url}" }`,
    };
  }

  public async getLocalTemplate(filePath: string): Promise<any> {
    const fpath = filePath.includes('/') ? filePath.split('/').slice(-1)[0] : filePath;
    return `{ "name": "${fpath}" }`;
  }
}

export const MockTemplates: {[stackName: string]: string[]} = {
  root: [
    'nested1',
    'nested2',
  ],
  nested1: [
    'nested3',
  ],
  nested2: [],
  nested3: [
    'nested4',
  ],
  nested4: [],
};
