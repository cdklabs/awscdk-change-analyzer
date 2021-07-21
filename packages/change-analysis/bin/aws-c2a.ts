#!/usr/bin/env node
import * as path from 'path';
import * as yargs from 'yargs';

function versionNumber(): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require(path.resolve('package.json')).version.replace(/\+[0-9a-f]+$/, '');
}


async function parseArguments() {
  //
  return yargs
    .usage('Usage: aws-c2a -a <cdk-app> COMMAND')
    .option('app', { type: 'string', alias: 'a', desc: 'REQUIRED: Path to your cloud assembly directory (e.g. "assembly-Pipeline-Stage/")', requiresArg: true, demandOption: true })
    .command('diff', 'Compares the cdk app the deployed stack or a local template file', yargs => yargs
      .option('rules', { type: 'string', alias: 'r', desc: 'The rules that you want to diff against', requiresArg: true, demandOption: true })
      .option('template-file', { type: 'string', alias: 't', desc: 'Compare the cdk app to a local template file', requiresArg: true})
      .option('out', { type: 'string', alias: 'o', desc: 'The output file after running the diff', requiresArg: true, default: 'out.json' }),
    )
    .version(versionNumber())
    .alias('v', 'version')
    .demandCommand(1, '') // just print help
    .recommendCommands()
    .help()
    .alias('h', 'help')
    .argv;
}

async function main() {
  const argv = await parseArguments();
  console.log(argv);
}

main();