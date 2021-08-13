import * as fs from 'fs';
import * as AWS from 'aws-sdk';

/**
 * SDK calls required for aws-c2a
 */
export interface IC2AHost {
  readonly describeStackResources: (stackName: string) => Promise<AWS.CloudFormation.StackResources | undefined>;
  readonly describeCfnStack: (stackName: string) => Promise<AWS.CloudFormation.Stack | undefined>;
  readonly getCfnTemplate: (stackName: string) => Promise<any>;
  readonly getS3Object: (url: string) => Promise<any>;
  readonly getLocalTemplate: (filePath: string) => Promise<any>;
}

/**
 * An AWS account
 *
 * An AWS account always exists in only one partition. Usually we don't care about
 * the partition, but when we need to form ARNs we do.
 */
export interface Account {
  /**
   * The account number
   */
  readonly accountId: string;

  /**
   * The partition ('aws' or 'aws-cn' or otherwise)
   */
  readonly partition: string;
}

/**
 * The default implementation to perform AWS SDK calls.
 */
export class DefaultC2AHost implements IC2AHost {
  private account?: Account;
  private readonly cfn: AWS.CloudFormation;
  private readonly s3: AWS.S3;

  constructor(profile?: string) {
    AWS.config.update({ stsRegionalEndpoints: 'regional' });
    if (profile) {
      AWS.config.credentials = new AWS.SharedIniFileCredentials({profile});
    }

    this.cfn = new AWS.CloudFormation({ region: this.discoverDefaultRegion() });
    this.s3 = new AWS.S3({ region: this.discoverDefaultRegion() });
  }

  /**
   * Given a stack name, return the stack's resources.
   */
  public async describeStackResources(stackName: string): Promise<AWS.CloudFormation.StackResources | undefined> {
    const {StackResources} = await this.cfn.describeStackResources({ StackName: stackName }).promise();
    return StackResources;
  }

  /**
   * Given a stack name, return the first stack from the query.
   */
  public async describeCfnStack(stackName: string): Promise<AWS.CloudFormation.Stack | undefined> {
    const { Stacks } = await this.cfn.describeStacks({ StackName: stackName }).promise();
    return Stacks?.[0];
  }

  /**
   * Given a stack name, return the CloudFormation Template Response
   */
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

  /**
   * Given a file path, read the file.
   *
   * @param filePath The file path for a local cfn template
   * @returns The template in string form
   */
  public async getLocalTemplate (filePath: string): Promise<string> {
    return await fs.promises.readFile(filePath, 'utf8');
  }


  public async discoverPartition(): Promise<string> {
    return (await this.discoverCurrentAccount()).partition;
  }

  public discoverDefaultRegion(): string {
    return AWS.config.region || 'us-east-1';
  }

  public async discoverCurrentAccount(): Promise<Account> {
    if (this.account === undefined) {
      const sts = new AWS.STS();
      const response = await sts.getCallerIdentity().promise();
      if (!response.Account || !response.Arn) {
        throw new Error(`Unrecognized reponse from STS: '${JSON.stringify(response)}'`);
      }
      this.account = {
        accountId: response.Account,
        partition: response.Arn.split(':')[1],
      };
    }

    return this.account;
  }
}

/**
 * Given a s3 url, extract and return the bucket and key for the object.
 *
 * @param url A s3 url in the form 'https://s3.amazon.com/[bucketName]/[objectKey]'
 * @returns Bucket and Key
 */
export function getS3PropertiesFromUrl(url: string): { Bucket: string, Key: string } {
  const splitS3 = url.split('s3');
  if (splitS3.length < 2) error('S3 url does not contain an s3 split.');

  const splitParams = splitS3[1].split('/');
  if (splitParams.length == 2) error('S3 ObjectKey could not be found in url.');
  else if (splitParams.length == 1) error('S3 BucketName and ObjectKey could not be found in url.');

  const [bucket, ...key] = splitParams.slice(1);

  return {
    Bucket: bucket,
    Key: key.join('/'),
  };

  function error (message: string) {
    throw new Error(`${message} Expected the form 'https://s3.amazon.com/[bucketName]/[objectKey]', received: ${url}`);
  }
}