import { MockArchitecture } from './architecture';
const architecture = new MockArchitecture();

export const config = { update: () => undefined };

export const CloudFormation = jest.fn(() => {
  return {
    describeStackResources: jest.fn(({ StackName }) =>
      ({ promise: () => architecture.mockGetCfn(StackName) }),
    ),
    describeStacks: jest.fn(({StackName}) =>
      ({ promise: () => ({ Stacks: [architecture.mockGetCfn(StackName)] }) }),
    ),
    getTemplate: jest.fn(({StackName}) =>
      ({ promise: () => ({ TemplateBody: architecture.mockGetCfn(StackName)?.toString() }) }),
    ),
  };
});
export const S3 = jest.fn(() => {
  return {
    getObject: jest.fn(({Bucket, Key}) =>
      ({ promise: () => ({ Body: architecture.mockGetS3(Bucket, Key)?.toString() }) }),
    ),
  };
});