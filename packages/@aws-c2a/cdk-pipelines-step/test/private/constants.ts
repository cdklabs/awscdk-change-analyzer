import { stringLike } from '@aws-cdk/assert';

export const CODEBUILD_BASE_POLICIES = [
  {
    Action: 'sts:AssumeRole',
    Condition: {
      'ForAnyValue:StringEquals': {
        'iam:ResourceTag/aws-cdk:bootstrap-role': [
          'deploy',
        ],
      },
    },
    Effect: 'Allow',
    Resource: '*',
  },
  {
    Action: 'lambda:InvokeFunction',
    Effect: 'Allow',
    Resource: {
      'Fn::GetAtt': [
        stringLike('*AutoApprove*'),
        'Arn',
      ],
    },
  },
  {
    Action: ['cloudformation:GetTemplate', 'cloudformation:DescribeStackResources', 'cloudformation:DescribeStacks'],
    Effect: 'Allow',
    Resource: '*',
  },
  {
    Action: ['s3:GetObject*', 's3:GetBucket*', 's3:List*'],
    Effect: 'Allow',
    Resource: [
      { 'Fn::GetAtt': [ 'CdkPipelineArtifactsBucket7B46C7BF', 'Arn' ] },
      {
        'Fn::Join': [  '', [
          { 'Fn::GetAtt': [  'CdkPipelineArtifactsBucket7B46C7BF', 'Arn' ] },
          '/*',
        ],
        ],
      },
    ],
  },
];