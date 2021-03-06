// eslint-disable-next-line import/no-extraneous-dependencies
import * as AWS from 'aws-sdk';

const client = new AWS.CodePipeline({ apiVersion: '2015-07-09' });
const TIMEOUT_IN_MINUTES = 5;

const sleep = (seconds: number): Promise<void> => {
  return new Promise<void>(resolve => setTimeout(resolve, seconds * 1000));
};

interface ApproveLambdaEvent {
  readonly PipelineName: string;
  readonly StageName: string;
  readonly ActionName: string;
}

export async function handler(event: ApproveLambdaEvent): Promise<void> {
  const {
    PipelineName: pipelineName,
    StageName: stageName,
    ActionName: actionName,
  } = event;

  function parseState(response: AWS.CodePipeline.Types.GetPipelineStateOutput): string | undefined {
    const stages = response.stageStates;
    const validStages = stages?.filter((s: AWS.CodePipeline.StageState) => s.stageName === stageName);
    const manualApproval = validStages?.[0].actionStates
      ?.filter((state: AWS.CodePipeline.ActionState) => state.actionName === actionName);
    const latest = manualApproval?.length && manualApproval[0].latestExecution;

    return latest ? latest.token : undefined;
  }

  const deadline = Date.now() + TIMEOUT_IN_MINUTES * 60000;
  while (Date.now() < deadline) {
    const response = await client.getPipelineState({ name: pipelineName }).promise();
    const token = parseState(response);
    if (token) {
      await client.putApprovalResult({
        pipelineName,
        actionName,
        stageName,
        result: {
          summary: 'No security changes detected. Automatically approved by Lambda.',
          status: 'Approved',
        },
        token,
      }).promise();
      return;
    }
    await sleep(5);
  }
}
