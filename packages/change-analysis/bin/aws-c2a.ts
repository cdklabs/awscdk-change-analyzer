#!/usr/bin/env node
import * as path from 'path';
import * as yargs from 'yargs';
import * as cxapi from '@aws-cdk/cx-api';
import { C2AToolkit, CloudAssembly, DefaultC2AHost } from '../lib';
import { print } from '../lib/private/logging';
import { versionNumber } from '../lib/private/version';
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-shadow */ // yargs

async function parseArguments() {
  // Use the following configuration for array arguments:
  //
  //     { type: 'array', default: [], nargs: 1, requiresArg: true }
  //
  // The default behavior of yargs is to eat all strings following an array argument:
  //
  //   ./prog --arg one two positional  => will parse to { arg: ['one', 'two', 'positional'], _: [] } (so no positional arguments)
  //   ./prog --arg one two -- positional  => does not help, for reasons that I can't understand. Still gets parsed incorrectly.
  //
  // By using the config above, every --arg will only consume one argument, so you can do the following:
  //
  //   ./prog --arg one --arg two position  =>  will parse to  { arg: ['one', 'two'], _: ['positional'] }.

  return yargs
    .usage('Usage: aws-c2a -a <cdk-app> COMMAND')
    .option('app', { type: 'string', alias: 'a', desc: 'REQUIRED: Path to your cloud assembly directory (e.g. "assembly-Pipeline-Stage/")', requiresArg: true, demandOption: true })
    .command('diff [STACKS..]', 'Compares the cdk app the deployed stack or a local template file', yargs => yargs
      .option('rulesPath', { type: 'string', alias: 'r', desc: 'The rules that you want to diff against', requiresArg: true, demandOption: true })
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

async function main(): Promise<number> {
  const argv = await parseArguments();
  const command = argv._[0];
  
  const host = new DefaultC2AHost();
  const asm = new CloudAssembly(new cxapi.CloudAssembly(argv.app));
  const cli = new C2AToolkit(asm, host);

  switch (command) {
    case 'diff': {
      return cli.c2aDiff({
        stackNames: (argv.STACKS || []) as string[],
        rulesPath: argv.rulesPath,
        outputPath: argv.out,
      });
    }
    default: 
      return 1;
  }
}

main().catch(err => {
  print(err);
  process.exitCode = 1;
});