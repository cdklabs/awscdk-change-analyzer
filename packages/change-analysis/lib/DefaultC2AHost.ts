import * as fs from 'fs';
import * as AWS from 'aws-sdk';
import { IC2AHost } from './toolkit';
import { deserializeStructure } from './helpers/yml';

interface StackInfo {
  template: any;
  parameters?: AWS.CloudFormation.Parameters;
}

export class DefaultC2AHost implements IC2AHost {

  public async getCfnTemplate(stackName: string): Promise<StackInfo> {
    const cfn = new AWS.CloudFormation();
    const response = await cfn.getTemplate({ StackName: stackName, TemplateStage: 'Original'}).promise();
    const { Stacks } = await cfn.describeStacks({ StackName: stackName }).promise();

    const region = Stacks?.[0].StackId?.split(':')[3];
    const url = region?.startsWith('cn') ? 'amazonaws.com.cn' : 'amazonaws.com';
    const parameters: AWS.CloudFormation.Parameters = (Stacks?.[0].Parameters ?? []).concat([
      {
        ParameterKey: 'AWS::Region',
        ParameterValue: region,
      },
      {
        ParameterKey: 'AWS::URLSuffix',
        ParameterValue: url,
      },
    ]);

    return {
      template: (response.TemplateBody && deserializeStructure(response.TemplateBody)) || {},
      parameters,
    };
  }

  /**
   * Given an S3 url, return the object in question.
   *
   * @param url s3 url in the form of `https://s3.amazon.com/[bucketName]/[objectKey]`
   * @returns the object associated to a s3 url
   */
  public async getS3Object(url: string): Promise<StackInfo> {
    const s3 = new AWS.S3();
    const splitS3 = url.split('s3');
    if (splitS3.length < 2) error('S3 url does not contain an s3 split.');
  
    const splitParams = splitS3[1].split('/');
    if (splitParams.length == 2) error('S3 ObjectKey could not be found in url.');
    else if (splitParams.length == 1) error('S3 BucketName and ObjectKey could not be found in url.');
    
    const [_, bucket, ...key] = splitParams;
    return {
      template: await s3.getObject({ Bucket: bucket, Key: key.join('/') }).promise(),
    };

    function error (message: string) {
      throw new Error(`${message} Expected the form 'https://s3.amazon.com/[bucketName]/[objectKey]', received: ${url}`);
    }
  }

  public async getLocalTemplate (filePath: string): Promise<StackInfo> {
    return {
      template: await fs.promises.readFile(filePath, 'utf8'),
    };
  }
}