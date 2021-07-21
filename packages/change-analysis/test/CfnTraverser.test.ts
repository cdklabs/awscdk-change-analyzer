import { DefaultC2AHost, IC2AHost, TemplateTree, traverseCfn, traverseLocal, traverseS3 } from '../lib';

function promise(input: string): Promise<any> {
  return new Promise((resolve) => {
    let wait = setTimeout(() => {
      clearTimeout(wait);
      resolve(input);
    });
  });
}

class MockHost implements IC2AHost {

  public async getStackTemplate(stackName: string): Promise<any> {
    return promise(stackName);
  }

  public async getS3Object(url: string): Promise<any> {
    return promise(url);
  }

  public async getLocalTemplate(filePath: string): Promise<any> {
    return promise(filePath);
  }
}

describe('Cfn Traverser on mock host', () => {
  // GIVEN
  let host: MockHost;
  beforeAll(() => {
    host = new MockHost();
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
                  nestedTemplates: {},
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
    const output = await traverseCfn('root', host);
  
    // THEN
    expectation(output);
  });

  test('successfully runs on s3 template', async () => {
    // WHEN
    const output = await traverseS3('root', host);

    // THEN
    expectation(output);
  });

  test('successfully runs on s3 template', async () => {
    // WHEN
    const output = await traverseLocal('root', host);

    // THEN
    expectation(output);
  });
});

describe('Traverse on real data', () => {
  // GIVEN
  let host: DefaultC2AHost;
  beforeAll(() => {
    host = new DefaultC2AHost();
  });

  test('runs on cloudformation', async () => {
    const output = await traverseCfn('NestedStackApp', host);

    console.log(output);
  });
});