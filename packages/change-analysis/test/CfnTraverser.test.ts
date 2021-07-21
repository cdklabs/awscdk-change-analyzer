import { CfnTraverser, IC2AHost, TemplateTree } from '../lib';

function promise(input: string): Promise<any> {
  return new Promise((resolve) => {
    let wait = setTimeout(() => {
      clearTimeout(wait);
      resolve(input);
    });
  });
}

class MockHost implements IC2AHost {

  public async getCfnTemplate(stackName: string): Promise<any> {
    return promise(stackName);
  }

  public async getS3Object(url: string): Promise<any> {
    return promise(url);
  }

  public async getLocalTemplate(filePath: string): Promise<any> {
    return promise(filePath);
  }
}

let host = new MockHost();
let traverser = new CfnTraverser(host);
traverser.findNestedTemplates = (stackName: string): string[] => {
  return MockTemplates[stackName] ?? [];
}

describe('Cfn Traverser on mock host', () => {
  // GIVEN
  let traverser: CfnTraverser;
  let host: MockHost;
  beforeAll(() => {
    host = new MockHost();
    traverser = new CfnTraverser(host);
    traverser.findNestedTemplates = (stackName: string): string[] => {
      return MockTemplates[stackName] ?? [];
    }
  });

  const expectation = (output: TemplateTree) => {
    expect(output).toEqual({
      rootTemplate: 'root',
      nestedTemplates: {
        nested1: {
          rootTemplate: 'nested1',
          nestedTemplates: {
            nested3: {
              rootTemplate: 'nested3',
              nestedTemplates: {
                nested4: {
                  rootTemplate: 'nested4',
                  nestedTemplates: {}
                }
              }
            },
          }
        },
        nested2: {
          rootTemplate: 'nested2',
          nestedTemplates: {},
        },
      },
    });
  }

  test('successfully runs on cfn template', async () => {
    // WHEN
    const output = await traverser.traverseCfn('root');

    // THEN
    expectation(output);
  });

  test('successfully runs on s3 template', async () => {
    // WHEN
    const output = await traverser.traverseS3('root');

    // THEN
    expectation(output);
  });


});

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
