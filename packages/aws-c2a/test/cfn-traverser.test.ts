import * as path from 'path';
import * as cx from '@aws-cdk/cx-api';
import { CfnTraverser, CloudAssembly, DefaultC2AHost, TemplateTree } from '../lib';
import { MockHost, MockTemplates } from './utils/mocks/c2a-host';

jest.mock('aws-sdk');

describe('Cfn Traverser on mocked sdk', () => {  // GIVEN
  let traverser: CfnTraverser;
  beforeAll(() => {
    const host = new DefaultC2AHost();
    const asm = new CloudAssembly(new cx.CloudAssembly(path.resolve(__dirname, 'fixtures/nested-stacks')));
    traverser = new CfnTraverser(host, asm);
  });

  // Reset all mocks after each test
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('Runs on root cfn template', async () => {
    // WHEN
    const output = await traverser.traverseCfn('root');

    // THEN
    expect(output).toEqual(rootOutput);
  });

  test('Runs on single cfn template', async () => {
    // WHEN
    const output = await traverser.traverseCfn('nested3');

    // THEN
    expect(output).toEqual(nested3Output);
  });

  test('Runs on single s3 template', async () => {
    // WHEN
    const output = await traverser.traverseS3('https://s3.amazon.com/myBucket/nested3', 'nested3');

    // THEN
    expect(output).toEqual(nested3Output);
  });
});

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

  test('successfully runs on cfn template', async () => {
    // WHEN
    const output = await traverser.traverseCfn('root');

    // THEN
    MockHostExpectation(output);
  });

  test('successfully runs on s3 template', async () => {
    // WHEN
    const output = await traverser.traverseS3('root');

    // THEN
    MockHostExpectation(output);
  });

  test('successfully runs on local template', async () => {
    // WHEN
    const output = await traverser.traverseLocal('root');

    // THEN
    MockHostExpectation(output);
  });
});

const MockHostExpectation = (output: TemplateTree) => {
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

const properties = (name: string) => ({
  Properties: {
    LogicalResourceId: name,
    PhysicalResourceId: name,
    ResourceType: 'AWS::CloudFormation::Stack',
    TemplateURL: `https://s3.amazon.com/myBucket/${name}`,
    Type: 'AWS::CloudFormation::Stack',
  },
  Type: 'AWS::CloudFormation::Stack',
});

const nested3Output = {
  rootTemplate: { Resources: {} },
  nestedTemplates: {},
};

const nested2Output = {
  rootTemplate: { Resources: {} },
  nestedTemplates: {},
};

const nested1Output = {
  rootTemplate: {
    Resources: { nested3: properties('nested3') },
  },
  nestedTemplates: {
    nested3: nested3Output,
  },
};

const rootOutput = {
  rootTemplate: {
    Resources: {
      nested1: properties('nested1'),
      nested2: properties('nested2'),
    },
  },
  nestedTemplates: {
    nested1: nested1Output,
    nested2: nested2Output,
  },
};