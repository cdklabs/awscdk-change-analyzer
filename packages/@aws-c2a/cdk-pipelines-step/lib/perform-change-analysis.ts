import { IStage } from '@aws-cdk/aws-codepipeline';
import * as cpa from '@aws-cdk/aws-codepipeline-actions';
import * as sns from '@aws-cdk/aws-sns';
import { Stage } from '@aws-cdk/core';
import { CodePipeline, CodePipelineActionFactoryResult, ICodePipelineActionFactory, ProduceActionOptions, Step } from '@aws-cdk/pipelines';
import { Node } from 'constructs';
import { ChangeAnalysisCheck } from './private/change-analysis-check';
import { DiskRuleSet, PreDefinedRuleSet, RuleSet } from './rule-set';

/**
 * Properties for a `PerformChangeAnalysis`
 */
export interface PerformChangeAnalysisProps {
  /**
   * The CDK Stage object to check the stacks of
   *
   * This should be the same Stage object you are passing to `addStage()`.
   */
  readonly stage: Stage;
  /**
   * Topic to send notifications when a human needs to give manual confirmation
   *
   * @default - no notification
   */
  readonly notificationTopic?: sns.ITopic;
  /**
   * Clean up the web app s3 bucket objects when deleting the stack.
   *
   * @default true
   */
  readonly autoDeleteObjects?: boolean;
  /**
   * The Rule Set associated with this step
   */
  readonly ruleSets: RuleSet[];
}

/**
 * Pause the pipeline if a deployment would add IAM permissions or Security Group rules
 *
 * This step is only supported in CodePipeline pipelines.
 */
export class PerformChangeAnalysis extends Step implements ICodePipelineActionFactory {
  constructor(id: string, private readonly props: PerformChangeAnalysisProps) {
    super(id);
  }

  public produceAction(stage: IStage, options: ProduceActionOptions): CodePipelineActionFactoryResult {
    const { c2aDiffProject } = this.getOrCreateChangeAnalysis(options.pipeline);
    const broadeningPermissions = this.props.ruleSets.some(set =>
      set instanceof PreDefinedRuleSet && set.name === 'BROADENING_PERMISSIONS');
    const rulesets = (this.props.ruleSets
      .filter(set => set instanceof DiskRuleSet) as DiskRuleSet[])
      .map((set: DiskRuleSet) => {
        set.grantRead(c2aDiffProject);
        return set.bind(options.pipeline);
      });
    this.props.notificationTopic?.grantPublish(c2aDiffProject);

    const variablesNamespace = Node.of(this.props.stage).addr;

    const approveActionName = `${options.actionName}.Confirm`;
    stage.addAction(new cpa.CodeBuildAction({
      runOrder: options.runOrder,
      actionName: `${options.actionName}.Check`,
      input: options.artifacts.toCodePipeline(options.pipeline.cloudAssemblyFileSet),
      project: c2aDiffProject,
      variablesNamespace,
      environmentVariables: {
        CODEPIPELINE_EXECUTION_ID: { value: '#{codepipeline.PipelineExecutionId}' },
        STAGE_PATH: { value: Node.of(this.props.stage).path },
        STAGE_NAME: { value: stage.stageName },
        ACTION_NAME: { value: approveActionName },
        ...broadeningPermissions ? {
          BROADENING_PERMISSIONS: { value: true },
        } : {},
        ...rulesets.length > 0 ? {
          BUCKETS: { value: rulesets.map(set => set.location?.bucketName) },
          RULE_SETS: { value: rulesets.map(set => set.location?.objectKey) },
        } : {},
        ...this.props.notificationTopic ? {
          NOTIFICATION_ARN: { value: this.props.notificationTopic.topicArn },
          NOTIFICATION_SUBJECT: { value: `Performed change analysis on ${this.props.stage.stageName}` },
        } : {},
      },
    }));

    stage.addAction(new cpa.ManualApprovalAction({
      actionName: approveActionName,
      runOrder: options.runOrder + 1,
      additionalInformation: `#{${variablesNamespace}.MESSAGE}`,
      externalEntityLink: `#{${variablesNamespace}.LINK}`,
    }));

    return { runOrdersConsumed: 2 };
  }

  private getOrCreateChangeAnalysis(pipeline: CodePipeline): ChangeAnalysisCheck {
    const id = 'ChangeAnalysisCheck';
    const existing = Node.of(pipeline).tryFindChild(id);
    if (existing) {
      if (!(existing instanceof ChangeAnalysisCheck)) {
        throw new Error(`Expected '${Node.of(existing).path}' to be 'ChangeAnalysisCheck' but was '${existing}'`);
      }
      return existing;
    }

    return new ChangeAnalysisCheck(pipeline, id, {
      codePipeline: pipeline.pipeline,
      autoDeleteObjects: this.props.autoDeleteObjects,
    });
  }
}