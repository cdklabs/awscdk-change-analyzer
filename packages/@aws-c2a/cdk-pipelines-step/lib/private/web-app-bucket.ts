import * as iam from '@aws-cdk/aws-iam';
import * as secrets from '@aws-cdk/aws-secretsmanager';
import * as s3 from '@aws-cdk/aws-s3';
import { Construct } from 'constructs';
import { RemovalPolicy, Stack } from '@aws-cdk/core';

// keep this import separate from other imports to reduce chance for merge conflicts with v2-main
// eslint-disable-next-line no-duplicate-imports, import/order
import { Construct as CoreConstruct } from '@aws-cdk/core';

export class WebAppBucket extends CoreConstruct {
  
  public readonly bucket: s3.IBucket;

  public readonly putObject: string;

  public readonly signObject: string;

  public readonly accessKeySecret: secrets.Secret;

  private readonly user: iam.User;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.bucket = new s3.Bucket(scope,' C2AWebAppBucket', {
      publicReadAccess: false,
      autoDeleteObjects: true,
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