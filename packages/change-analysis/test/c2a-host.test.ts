import * as path from 'path';
import { DefaultC2AHost } from '../lib';

jest.mock('aws-sdk');

describe('Default C2A Host', () => {
  // GIVEN
  let host:  DefaultC2AHost;
  beforeAll(() => {
    host = new DefaultC2AHost();
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('makes valid cloudformation calls', () => {
    // Reset all mocks after each test
    afterEach(() => {
      jest.clearAllMocks();
    });

    test('for describing stack resources', async () => {
      // WHEN
      const output = await host.describeStackResources('root');

      // THEN
      expect(output).toEqual(expectedOutput.Resources);
    });

    test('for describing a CFN stack', async () => {
      // WHEN
      const output = await host.describeCfnStack('root');

      // THEN
      expect(output).toEqual(expectedOutput);
    });

    test('for getting a cloudformation template', async () => {
      // WHEN
      const output = await host.getCfnTemplate('root');

      // THEN
      expect(JSON.parse(output.TemplateBody)).toEqual(mockedExpectedOutput);
    });

    test('for getting a s3 template', async () => {
      // WHEN
      const output = await host.getS3Object('https://s3.amazon.com/myBucket/root');

      // THEN
      expect(JSON.parse(output.Body)).toEqual(mockedExpectedOutput);
    });

    test('for getting a local template', async () => {
      // WHEN
      await host.getLocalTemplate(path.resolve(__dirname, 'fixtures/nested-stacks/manifest.json'));
    });
  });

  describe('running getS3 fails on', () => {
    test('url without "s3"', async () => {
      // WHEN
      const fail = () => host.getS3Object('test');

      // THEN
      await expect(fail()).rejects.toThrowError('S3 url does not contain an s3 split. Expected the form \'https://s3.amazon.com/[bucketName]/[objectKey]\', received: test');
    });

    test('url without delimited bucket name and object key', async () => {
      // WHEN
      const fail = () => host.getS3Object('https://s3.amazon.com');

      // THEN
      await expect(fail()).rejects.toThrowError('S3 BucketName and ObjectKey could not be found in url. Expected the form \'https://s3.amazon.com/[bucketName]/[objectKey]\', received: https://s3.amazon.com');
    });

    test('url without delimited object key', async () => {
      // WHEN
      const fail = () => host.getS3Object('https://s3.amazon.com/myBucket');

      // THEN
      await expect(fail()).rejects.toThrowError('S3 ObjectKey could not be found in url. Expected the form \'https://s3.amazon.com/[bucketName]/[objectKey]\', received: https://s3.amazon.com/myBucket');
    });
  });
});

const mockedExpectedOutput = {
  Resources: {
    nested1: {
      Properties: {
        LogicalResourceId: 'nested1',
        PhysicalResourceId: 'nested1',
        ResourceType: 'AWS::CloudFormation::Stack',
        TemplateURL: 'https://s3.amazon.com/myBucket/nested1',
        Type: 'AWS::CloudFormation::Stack',
      },
      Type: 'AWS::CloudFormation::Stack',
    },
    nested2: {
      Properties: {
        LogicalResourceId: 'nested2',
        PhysicalResourceId: 'nested2',
        ResourceType: 'AWS::CloudFormation::Stack',
        TemplateURL: 'https://s3.amazon.com/myBucket/nested2',
        Type: 'AWS::CloudFormation::Stack',
      },
      Type: 'AWS::CloudFormation::Stack',
    },
  },
};

const expectedOutput = {
  Resources: [
    {
      LogicalResourceId: 'nested1',
      PhysicalResourceId: 'nested1',
      ResourceType: 'AWS::CloudFormation::Stack',
      TemplateURL: 'https://s3.amazon.com/myBucket/nested1',
      Type: 'AWS::CloudFormation::Stack',
    },
    {
      LogicalResourceId: 'nested2',
      PhysicalResourceId: 'nested2',
      ResourceType: 'AWS::CloudFormation::Stack',
      TemplateURL: 'https://s3.amazon.com/myBucket/nested2',
      Type: 'AWS::CloudFormation::Stack',
    },
  ],
  StackId: 'arn:aws:cloudformation:us-east-1:123456789012:stack/root',
  Properties: {
    LogicalResourceId: 'root',
    PhysicalResourceId: 'root',
    ResourceType: 'AWS::CloudFormation::Stack',
    TemplateURL: 'https://s3.amazon.com/myBucket/root',
  },
};