import '@aws-cdk/assert/jest';
import {anything, arrayWith, encodedJson, objectLike, stringLike} from '@aws-cdk/assert';
import {Topic} from '@aws-cdk/aws-sns';
import { Stack } from '@aws-cdk/core';
import * as cdkp from '@aws-cdk/pipelines';
import { PerformChangeAnalysis } from '../lib';
import { ModernTestGitHubNpmPipeline } from './private/modern-pipeline';
import { OneStackApp, PIPELINE_ENV, TestApp } from './private/test-app';

describe('perform change analysis', () => {
  let app: TestApp;
  let pipelineStack: Stack;
  let pipeline: cdkp.CodePipeline;
  beforeEach(() => {
    // GIVEN
    app = new TestApp();
    pipelineStack = new Stack(app, 'C2APipelineUnitStack', { env: PIPELINE_ENV });
    pipeline = new ModernTestGitHubNpmPipeline(pipelineStack, 'Cdk');
  });

  afterEach(() => {
    app.cleanup();
  });

  test('generates lambda/codebuild/s3 at pipeline scope', () => {
    // WHEN
    const stage = new OneStackApp(app, 'App');
    pipeline.addStage(stage, {
      pre: [
        new PerformChangeAnalysis('Check', {
          stage,
        }),
      ],
    });

    // THEN
    expect(pipelineStack).toCountResources('AWS::Lambda::Function', 1);
    expect(pipelineStack).toHaveResourceLike('AWS::Lambda::Function', {
      Role: {
        'Fn::GetAtt': [
          stringLike('CdkPipeline*ChangeAnalysisCheckC2APipelinesAutoApproveServiceRole*'),
          'Arn',
        ],
      },
    });
    // 1 for github build, 1 for synth stage, and 1 for the application security check
    expect(pipelineStack).toCountResources('AWS::CodeBuild::Project', 3);
    // 1 for OneStackApp, 1 for web app
    expect(pipelineStack).toCountResources('AWS::S3::Bucket', 2);
  });

  test('passes correct environment variables to CodeBuild project', () => {
    // WHEN
    const stage = new OneStackApp(pipelineStack, 'App');
    pipeline.addStage(stage, {
      pre: [
        new PerformChangeAnalysis('Check', {
          stage,
        }),
      ],
    });

    // THEN
    expect(pipelineStack).toHaveResourceLike('AWS::CodePipeline::Pipeline', {
      Stages: arrayWith(
        {
          Name: 'App',
          Actions: arrayWith(
            objectLike({
              Name: stringLike('*Check'),
              Configuration: objectLike({
                EnvironmentVariables: encodedJson([
                  { name: 'STAGE_PATH', type: 'PLAINTEXT', value: 'C2APipelineUnitStack/App' },
                  { name: 'STAGE_NAME', type: 'PLAINTEXT', value: 'App' },
                  { name: 'ACTION_NAME', type: 'PLAINTEXT', value: anything() },
                ]),
              }),
            }),
          ),
        },
      ),
    });
  });

  test('creates pipeline w/ auto approve tags and lambda/codebuild/s3 w/ valid permissions', () => {
    // WHEN
    const stage = new OneStackApp(app, 'App');
    pipeline.addStage(stage, {
      pre: [
        new PerformChangeAnalysis('Check', {
          stage,
        }),
      ],
    });

    // THEN
    // CodePipeline must be tagged as SECURITY_CHECK=ALLOW_APPROVE
    expect(pipelineStack).toHaveResource('AWS::CodePipeline::Pipeline', {
      Tags: [
        {
          Key: 'CHANGE_ANALYSIS',
          Value: 'ALLOW_APPROVE',
        },
      ],
    });
    // Lambda Function only has access to pipelines tagged CHANGE_ANALYSIS=ALLOW_APPROVE
    expect(pipelineStack).toHaveResourceLike('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: [
          {
            Action: ['codepipeline:GetPipelineState', 'codepipeline:PutApprovalResult'],
            Condition: {
              StringEquals: { 'aws:ResourceTag/CHANGE_ANALYSIS': 'ALLOW_APPROVE' },
            },
            Effect: 'Allow',
            Resource: '*',
          },
        ],
      },
    });
    // CodeBuild must have access to the stacks and get their resource, invoking the lambda function, and accessing the s3 bucket
    expect(pipelineStack).toHaveResourceLike('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: arrayWith(
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
        ),
      },
    });
  });

  test('configures notification topic properly', () => {
    // WHEN
    const topic = new Topic(pipelineStack, 'NotificationTopic');
    const stage = new OneStackApp(app, 'App');
    pipeline.addStage(stage, {
      pre: [
        new PerformChangeAnalysis('Check', {
          stage,
          notificationTopic: topic,
        }),
      ],
    });

    expect(pipelineStack).toCountResources('AWS::SNS::Topic', 1);
    expect(pipelineStack).toHaveResourceLike('AWS::CodePipeline::Pipeline', {
      Stages: arrayWith(
        {
          Name: 'App',
          Actions: [
            objectLike({
              Configuration: {
                ProjectName: { Ref: stringLike('*ChangeAnalysisCheck*') },
                EnvironmentVariables: {
                  'Fn::Join': ['', [
                    stringLike('*'),
                    { Ref: 'NotificationTopicEB7A0DF1' },
                    stringLike('*'),
                  ]],
                },
              },
              Name: stringLike('*Check'),
              Namespace: stringLike('*'),
              RunOrder: 1,
            }),
            objectLike({
              Configuration: {
                CustomData: stringLike('#{*.MESSAGE}'),
                ExternalEntityLink: stringLike('#{*.LINK}'),
              },
              Name: stringLike('*Confirm'),
              RunOrder: 2,
            }),
            objectLike({ Name: 'Stack.Prepare', RunOrder: 3 }),
            objectLike({ Name: 'Stack.Deploy', RunOrder: 4 }),
          ],
        },
      ),
    });
  })
});