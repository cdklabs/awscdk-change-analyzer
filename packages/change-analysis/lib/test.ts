import * as path from 'path';
import * as cxapi from '@aws-cdk/cx-api';
import * as AWS from 'aws-sdk';
import { DefaultC2AHost } from '.';
import { CloudAssembly } from './cloud-assembly';
import { C2AToolkit } from './toolkit';

AWS.config.update({ region: 'us-west-2' });

async function main() {
  const host = new DefaultC2AHost();
  const rawAsm = new cxapi.CloudAssembly(path.resolve(__dirname, '../test/fixtures/nested-stacks'));
  const asm = new CloudAssembly(rawAsm);
  const tk = new C2AToolkit(asm, host);
  tk.c2aDiff({
    stackNames: [],
    rulesPath: path.resolve('rules.json'),
    outputPath: 'out.json',
  });
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});