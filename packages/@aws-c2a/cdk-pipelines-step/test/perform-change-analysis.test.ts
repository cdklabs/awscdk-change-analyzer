import '@aws-cdk/assert/jest';
import {stringLike} from '@aws-cdk/assert';
import { Topic } from '@aws-cdk/aws-sns';
import { Stack } from '@aws-cdk/core';
import * as cdkp from '@aws-cdk/pipelines';
import { ModernTestGitHubNpmPipeline } from './private/modern-pipeline';
import { OneStackApp, PIPELINE_ENV, TestApp } from './private/test-app';
import { PerformChangeAnalysis } from '../lib';


describe('perform change analysis', () => {
  let app: TestApp;
  let pipelineStack: Stack;
  let pipeline: cdkp.CodePipeline;
  beforeEach(() => {
    app = new TestApp();
    pipelineStack = new Stack(app, 'C2APipelineUnitStack', { env: PIPELINE_ENV });
    pipeline = new ModernTestGitHubNpmPipeline(pipelineStack, 'Cdk');
  });
  
  afterEach(() => {
    app.cleanup();
  });

  test('generates lambda/codebuild/s3 at pipeline scope', () => {
    const stage = new OneStackApp(app, 'App');
    pipeline.addStage(stage, {
      pre: [
        new PerformChangeAnalysis('Check', {
          stage,
        }),
      ],
    });

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
    expect(pipelineStack).toCountResources('AWS::S3:Bucket', 2);
    expect(pipelineStack).toHaveResourceLike('AWS::S3::Bucket', {
      Role: {
        'Fn::GetAtt': [
          stringLike('CdkPipeline*C2AWebappBucketServiceRole*'),
          'Arn',
        ],
      },
    });
  });


})