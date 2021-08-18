import * as iam from '@aws-cdk/aws-iam';
import * as s3 from '@aws-cdk/aws-s3';
import * as secrets from '@aws-cdk/aws-secretsmanager';
import { RemovalPolicy, Stack } from '@aws-cdk/core';

// keep this import separate from other imports to reduce chance for merge conflicts with v2-main
// eslint-disable-next-line no-duplicate-imports, import/order
import { Construct as CoreConstruct } from '@aws-cdk/core';
import { Construct } from 'constructs';

/**
 * The props to configure WebAppBucket
 */
export interface WebAppBucketProps {
  /**
   * Clean up all objects when bucket is attempted to
   * be deleted.
   *
   * @default true
   */
  readonly autoDeleteObjects?: boolean;
}

/**
 * A S3 Bucket that stores the html files to be viewed
 * during the Approval Action of stage configured with
 * ChangeAnalysisCheck.
 */
export class WebAppBucket extends CoreConstruct {
  /**
   * The s3 bucket that holds all the html files
   */
  public readonly bucket: s3.IBucket;
  /**
   * The aws cli command to put an html file into its
   * corresponding s3 bucket location.
   */
  public readonly putObject: string;
  /**
   * The aws cli command to generate a presigned url that
   * renders the change report hmtl file.
   *
   * Requires the environment variables:
   *  - $DOWNLOAD_USER_KEY
   *  - $DOWNLOAD_USER_SECRET
   */
  public readonly signObject: string;
  /**
   * The accessKeySecret of the user to generate the presigned url.
   *
   * The environment variable must be saved in the following manner:
   *  - $DOWNLOAD_USER_KEY: { value: `${accessKeySecret.secretArn}:AWS_ACCESS_KEY_ID` },
   *  - $DOWNLOAD_USER_SECRET: { value: `${accessKeySecret.secretArn}:AWS_SECRET_ACCESS_KEY` },
   */
  public readonly accessKeySecret: secrets.Secret;
  /**
   * The iam user that signs the s3 url for prolonged view time.
   *
   * We need an IAM user in order to have the presigned URL be able to be valid
   * for longer than 1hr.
   * https://docs.aws.amazon.com/AmazonS3/latest/dev/ShareObjectPreSignedURL.html
   */
  private readonly user: iam.User;

  constructor(scope: Construct, id: string, props?: WebAppBucketProps) {
    super(scope, id);

    this.bucket = new s3.Bucket(scope,' C2AWebAppBucket', {
      autoDeleteObjects: props?.autoDeleteObjects ?? true,
      publicReadAccess: false,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.user = new iam.User(this, 'C2ADownloadUser');

    const accessKey = new iam.CfnAccessKey(this, 'C2ADownloadUserKey', {
      userName: this.user.userName,
    });
    this.accessKeySecret = new secrets.Secret(this, 'AccessKeySecret', {
      description: 'Secret holding the access key for the IAM user we use to pre-sign URLs',
    });
    (this.accessKeySecret.node.defaultChild as secrets.CfnSecret).generateSecretString = undefined;
    (this.accessKeySecret.node.defaultChild as secrets.CfnSecret).secretString = Stack.of(this).toJsonString({
      AWS_ACCESS_KEY_ID: accessKey.ref,
      AWS_SECRET_ACCESS_KEY: accessKey.getAtt('SecretAccessKey'),
    });

    this.bucket.grantRead(this.user);

    this.putObject =
      'aws s3api put-object' +
      ` --bucket ${this.bucket.bucketName}` +
      ' --key $CODEPIPELINE_EXECUTION_ID/$STAGE_NAME/index.html' +
      ' --body index.html' +
      ' --content-type text/html';

    this.signObject =
      'env AWS_ACCESS_KEY_ID=$DOWNLOAD_USER_KEY AWS_SECRET_ACCESS_KEY=$DOWNLOAD_USER_SECRET' +
      ' aws s3 presign' +
      ` s3://${this.bucket.bucketName}/$CODEPIPELINE_EXECUTION_ID/$STAGE_NAME/index.html` +
      ' --expires-in 604800';
  }
}