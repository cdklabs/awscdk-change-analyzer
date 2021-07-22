import { DefaultC2AHost, CfnTraverser } from ".";
import * as AWS from 'aws-sdk';
import * as cxapi from '@aws-cdk/cx-api';
import * as path from 'path';
import { CloudAssembly, DefaultSelection, ExtendedStackSelection } from "./CloudAssembly";

AWS.config.update({ region: 'us-west-2' });

async function main() {
  const host = new DefaultC2AHost();
  const rawAsm = new cxapi.CloudAssembly(path.resolve('../test/cdk.out'));
  const asm = new CloudAssembly(rawAsm);
  const stacks = await asm.selectStacks({allTopLevel: true, patterns: []},{
    extend: ExtendedStackSelection.Upstream,
    defaultBehavior: DefaultSelection.MainAssembly,
  });
  const traverser = new CfnTraverser(host, asm);

  const localOutput = await traverser.traverseLocal(stacks.stackArtifacts[0].templateFile);
  const cfnOutput = await traverser.traverseCfn(stacks.stackArtifacts[0].stackName);

  console.log(localOutput);
  console.log(cfnOutput);
}

main().catch(err => {
  console.log(err);
  process.exitCode = 1;
});