import { getS3PropertiesFromUrl } from '../../../lib';

interface IStackInfo {
  readonly ResourceType: string;
  readonly LogicalResourceId: string;
  readonly PhysicalResourceId: string;
  readonly TemplateURL: string;
}

interface IResource extends IStackInfo {
  readonly Type: string;
  readonly TemplateURL: string;
}

/**
 * Class for creating Mock Cfn Stacks.
 *
 * Note: Very opinionated.
 */
export class MockCfnStack {
  public readonly Properties: IStackInfo;
  public readonly StackId: string;
  public readonly Resources: IResource[];
  public readonly ResourceType: string;
  public readonly s3Url: string;

  constructor(name: string) {
    this.Properties = {
      ResourceType: 'AWS::CloudFormation::Stack',
      LogicalResourceId: name,
      PhysicalResourceId: name,
      TemplateURL: `https://s3.amazon.com/myBucket/${name}`,
    };
    this.Resources = [];
    this.StackId = `arn:aws:cloudformation:us-east-1:123456789012:stack/${name}`;
  }

  public addResources(...nestedStacks: MockCfnStack[]) {
    this.Resources.push(...nestedStacks.map(nestedStack => ({
      Type: 'AWS::CloudFormation::Stack',
      ...nestedStack.Properties,
    })));
  }

  public toString(): string {
    return JSON.stringify({
      Resources: {
        ...this.Resources.reduce((acc, resource) => ({
          ...acc, [resource.PhysicalResourceId]: {
            Type: 'AWS::CloudFormation::Stack',
            Properties: resource,
          },
        }), {}),
      },
    });
  }

  get StackResources() { return this.Resources; }
}

/**
 * A mock cloud environment for testing.
 */
export class MockArchitecture {
  public readonly state: MockCfnStack[];

  public mockGetCfn = jest.fn((StackName) => {
    return this.state.find((s) => s.Properties.PhysicalResourceId === StackName);
  });

  public mockGetS3 = jest.fn((Bucket, Key) => {
    return this.state.find((s => {
      const {Bucket: s3Bucket, Key: s3Key} = getS3PropertiesFromUrl(s.Properties.TemplateURL);
      return s3Bucket === Bucket && s3Key === Key;
    }));
  });

  constructor () {
    const root = new MockCfnStack('root');
    const nested1 = new MockCfnStack('nested1');
    const nested2 = new MockCfnStack('nested2');
    const nested3 = new MockCfnStack('nested3');
    root.addResources(nested1, nested2);
    nested1.addResources(nested3);
    this.state = [root, nested1, nested2, nested3];
  }
}
