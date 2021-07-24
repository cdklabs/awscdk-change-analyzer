import * as path from 'path';
import * as cx from '@aws-cdk/cx-api';
import { CfnTraverser, CloudAssembly, IC2AHost, TemplateTree } from '../lib';
class MockHost implements IC2AHost {

  public async describeStackResources(_stackName: string) {
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


const MockTemplates: {[stackName: string]: string[]} = {
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


describe('Cfn Traverser on mock host', () => {
  // GIVEN
  let traverser: CfnTraverser;
  beforeAll(() => {
    const host = new MockHost();
    const asm = new CloudAssembly(new cx.CloudAssembly(path.resolve(__dirname, 'fixtures/nested-stacks')));
    traverser = new CfnTraverser(host, asm);
    traverser.findNestedTemplates = ({name}): string[][] => {
      return MockTemplates[name].map(n => [n, n]);
    };
    traverser._cfnParameters = async () => [];
  });

  const expectation = (output: TemplateTree) => {
    expect(output).toEqual({
      rootTemplate: { name: 'root' },
      nestedTemplates: {
        nested1: {
          rootTemplate: { name: 'nested1' },
          nestedTemplates: {
            nested3: {
              rootTemplate: { name: 'nested3' },
              nestedTemplates: {
                nested4: {
                  rootTemplate: { name: 'nested4' },
                  nestedTemplates: {},
                },
              },
            },
          },
        },
        nested2: {
          rootTemplate: { name: 'nested2' },
          nestedTemplates: {},
        },
      },
    });
  };

  // test('successfully runs on cfn template', async () => {
  //   // WHEN
  //   const output = await traverser.traverseCfn('root');

  //   // THEN
  //   expectation(output);
  // });

  // test('successfully runs on s3 template', async () => {
  //   // WHEN
  //   const output = await traverser.traverseS3('root');

  //   // THEN
  //   expectation(output);
  // });

  test('successfully runs on local template', async () => {
    // WHEN
    const output = await traverser.traverseLocal('root');

    // THEN
    expectation(output);
  });
});