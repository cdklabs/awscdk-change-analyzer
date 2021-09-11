import * as s3 from '@aws-cdk/aws-s3';
import * as cdk from '@aws-cdk/core';

const app = new cdk.App({
  context: {
    '@aws-cdk/core:newStyleStackSynthesis': 'true',
  },
});
const stack = new cdk.Stack(app, 'MyStack');
const bucket = new s3.Bucket(stack, 'MyBucket', {
  accessControl: s3.BucketAccessControl.PRIVATE,
});
cdk.Tags.of(bucket).add('key1', 'value1');
cdk.Tags.of(bucket).add('key2', 'value2');

app.synth();