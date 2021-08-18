# Perform Change Analysis

Perform Change Analysis (PCA) is a [CDK Construct](https://docs.aws.amazon.com/cdk/latest/guide/constructs.html) that functions as a
verification step within a [CDK Pipelines v2](https://aws.amazon.com/blogs/developer/cdk-pipelines-continuous-delivery-for-aws-cdk-applications/).
PCA is tool that allows you, the developer, to set up checkpoints within your
pipeline to monitor both security and architectural changes.

By inserting PCA before any stage deployment, PCA will run the [`AWS CDK Change Analyzer`](https://www.npmjs.com/package/aws-c2a)
(C2A) on a set of rules that you configure. If the upcoming deployment were
to violate any of these rules, the pipeline will pause and require you to confirm
the changes. We also create a static html file for you to easily view and traverse through
your changes.

PCA will appear as two distinct actions in your pipeline: first a CodeBuild project
that runs `aws-c2a diff` on the stage that's about to be deployed. If there are any
high risk changes detected, it will then run `aws-c2a html` to generate an html file
that will be securely uploaded to S3. Following the CodeBuild project is a Manual Approval
that pauses the pipeline and has a link to the generated html file now stored in S3.
If it so happens that there no high risk changed detected, the manual approval step
is automatically approved. The pipeline will look like this:

```txt
Pipeline
├── ...
├── MyApplicationStage
│    ├── MyApplication.Check           // Change Analysis Action
│    ├── MyApplication.Confirm         // Manual Approval Action
│    ├── Stack.Prepare
│    └── Stack.Deploy
└── ...
```

## Installation

Add the following to your `package.json`:

```
{
  "dependencies": {
    "@aws-c2a/cdk-pipelines-step": "^0.3.3"
  }
}
```

Make sure the following packages are in there as well, with
a CDK version of `1.115.0` or higher:

```
{
  "dependencies": {
    "@aws-cdk/aws-codebuild": "<VERSION>",
    "@aws-cdk/aws-codepipeline": "<VERSION>",
    "@aws-cdk/aws-codepipeline-actions": "<VERSION>",
    "@aws-cdk/aws-iam": "<VERSION>",
    "@aws-cdk/aws-lambda": "<VERSION>",
    "@aws-cdk/aws-s3": "<VERSION>",
    "@aws-cdk/aws-secretsmanager": "<VERSION>",
    "@aws-cdk/aws-sns": "<VERSION>",
    "@aws-cdk/core": "<VERSION>",
    "@aws-cdk/pipelines": "<VERSION>",
    "constructs": "^3.3.69"
  }
}
```

## Usage

You can insert `PerformChangeAnalysis` by using adding it as a step in a CDK pipeline stage:

```ts
const stage = new MyApplicationStage(this, 'MyApplication');
pipeline.addStage(stage, {
  pre: [
    new PerformChangeAnalysis('Check', { stage }),
  ],
});
```

To get notified when there is a change that needs your manual approval,
create an SNS Topic, subscribe your own email address, and pass it in as
as the `notificationTopic` property:

```ts
import * as sns from '@aws-cdk/aws-sns';
import * as subscriptions from '@aws-cdk/aws-sns-subscriptions';
import * as pipelines from '@aws-cdk/pipelines';

const topic = new sns.Topic(this, 'SecurityChangesTopic');
topic.addSubscription(new subscriptions.EmailSubscription('test@email.com'));

const stage = new MyApplicationStage(this, 'MyApplication');
pipeline.addStage(stage, {
  pre: [
    new PerformChangeAnalysis('Check', {
      stage,
      notificationTopic: topic,
    }),
  ],
});
```
