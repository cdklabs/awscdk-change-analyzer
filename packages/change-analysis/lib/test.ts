import { DefaultC2AHost, traverseCfn } from ".";
import * as AWS from 'aws-sdk';

AWS.config.update({region: 'us-west-2' });

async function main() {
  const host = new DefaultC2AHost();
  const output = await traverseCfn('NestedStackApp', host);
}

main()