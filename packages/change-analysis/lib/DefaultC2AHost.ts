import * as fs from 'fs';
import * as AWS from 'aws-sdk';
import { IC2AHost } from './toolkit';

export class DefaultC2AHost implements IC2AHost {
  private readonly cfn: AWS.CloudFormation;
  private readonly s3: AWS.S3;

  constructor() {
    this.cfn = new AWS.CloudFormation({region: 'us-west-2'});
    this.s3 = new AWS.S3({region: 'us-west-2'});
  }

  public async describeStackResources(stackName: string): Promise<AWS.CloudFormation.StackResources | undefined> {
    const {StackResources} = await this.cfn.describeStackResources({ StackName: stackName }).promise();
    return StackResources;
  }

  public async describeCfnStack(stackName: string): Promise<AWS.CloudFormation.Stack | undefined> {
    const { Stacks } = await this.cfn.describeStacks({ StackName: stackName }).promise();
    return Stacks?.[0];
  }

  public async getCfnTemplate(stackName: string): Promise<any> {
    const response = await this.cfn.getTemplate({ StackName: stackName, TemplateStage: 'Original'}).promise();
    return response;
  }

  /**
   * Given an S3 url, return the object in question.
   *
   * @param url s3 url in the form of `https://s3.amazon.com/[bucketName]/[objectKey]`
   * @returns the object associated to a s3 url
   */
  public async getS3Object(url: string): Promise<any> {
    const {Bucket, Key} = getS3PropertiesFromUrl(url);
    const response = await this.s3.getObject({ Bucket, Key }).promise();
    return response;
  }

  public async getLocalTemplate (filePath: string): Promise<string> {
    return await fs.promises.readFile(filePath, 'utf8');
  }
}

export function getS3PropertiesFromUrl(url: string): { Bucket: string, Key: string } {
  const splitS3 = url.split('s3');
  if (splitS3.length < 2) error('S3 url does not contain an s3 split.');

  const splitParams = splitS3[1].split('/');
  if (splitParams.length == 2) error('S3 ObjectKey could not be found in url.');
  else if (splitParams.length == 1) error('S3 BucketName and ObjectKey could not be found in url.');
  
  const [_, bucket, ...key] = splitParams;

  return {
    Bucket: bucket,
    Key: key.join('/'),
  }

  function error (message: string) {
    throw new Error(`${message} Expected the form 'https://s3.amazon.com/[bucketName]/[objectKey]', received: ${url}`);
  }
} 