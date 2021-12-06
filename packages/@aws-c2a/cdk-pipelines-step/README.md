# CDK Pipelines Step - CDK Change Analyzer (C2A)

This package contains `PerformChangeAnalysis`, a custom approval step for use with a [CDK Pipelines](https://docs.aws.amazon.com/cdk/api/latest/docs/pipelines-readme.html) pipeline. This approval step will help you:

* Review the changes that a CDK deployment will introduce to your infrastructure
  in a visual   interface.
* Write
  [rules](https://github.com/cdklabs/awscdk-change-analyzer/tree/main/packages/%40aws-c2a/rules)
  to automatically classify certain changes as "safe" or "unsafe", making sure
  you only need to review changes if there is something important to review.

> ![C2A: Developer
> Preview](https://img.shields.io/badge/CDK%20Change%20Analyzer-Developer%20Preview-orange.svg?style=for-the-badge)
>
> C2A is currently in Developer Preview. Let us know how this tool is working
> for you.

## Usage

Add the following to your `package.json`:

```
{
  "dependencies": {
    "@aws-c2a/cdk-pipelines-step": "0.5.0"
  }
}
```

Make sure the following packages are in there as well, with a CDK version of `1.115.0` or higher:

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

Insert `PerformChangeAnalysis` by adding it as a `pre` step when adding a Stage to a CDK pipeline:

```ts
import { PerformChangeAnalysis } from '@aws-c2a/cdk-pipelines-step';

const stage = new MyApplicationStage(this, 'MyApplication');
pipeline.addStage(stage, {
  pre: [
    new PerformChangeAnalysis('Check', { stage }),
  ],
});
```

## Effect on your pipeline

By inserting the `PerformChangeAnalysis` step before any stage deployment, the [CDK Change
Analyzer](https://github.com/cdklabs/awscdk-change-analyzer) (C2A) will be run to visualize
the changes that would be introduced to your deployment by the upcoming deployment, and a
a **Manual Approval** step is added to the pipeline to give you an opportunity to review
and confirm the changes. Your pipeline stage will look like this:

```
┌───────────────────────────────────────────────────────────────┐
│                      MyApplicationStage                       │
│                                                               │
│                                                               │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐  │
│  │         │     │         │     │         │     │         │  │
│  │  Check  │────▶│ Confirm │────▶│ Prepare │────▶│ Deploy  │  │
│  │         │     │         │     │         │     │         │  │
│  └─────────┘     └─────────┘     └─────────┘     └─────────┘  │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## Rules and automatic approvals

Rules can be used to automatically classify changes in a deployment. They can be
classified along 2 different axes:

* **Risk:** changes can be classified as *high*, *low* or *unknown* risk.
  This helps human reviewers concentrate effort on the most important types of
  changes when making a determination on whether or not to proceed with the
  deployment.
* **Effect:** changes can be automatically approved, or always rejected. In the
  former case, if all changes in a deployment are automatically classified as
  approved, the human review is skipped. Otherwise, if any of the changes in a
  deployment are rejected the deployment will fail and not proceed.

To automatically classify changes according to rules, write a JSON file in the
[rules
language](https://github.com/cdklabs/awscdk-change-analyzer/tree/main/packages/%40aws-c2a/rules) and pass it to the `PerformChangeAnalysis` step:

```ts
import { RuleSet, PerformChangeAnalysis } from '@aws-c2a/cdk-pipelines-step';

const stage = new MyApplicationStage(this, 'MyApplication');
pipeline.addStage(stage, {
  pre: [
    new PerformChangeAnalysis('Check', {
      stage,
      ruleSet: RuleSet.fromDisk(resolve(__dirname, 'rules.json')),
    }),
  ],
});
```

By default, the `PerformChangeAnalysis` will always run a suite of rules
that checks for broadening of IAM permissions, equivalent to what the CDK CLI
will check for during `cdk deploy`. To turn this off, pass
`broadeningPermissions: false`:

```ts
const stage = new MyApplicationStage(this, 'MyApplication');
pipeline.addStage(stage, {
  pre: [
    new PerformChangeAnalysis('Check', {
      stage,
      broadeningPermissions: false,
    }),
  ],
});
```

## Get notified of a pending review

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
