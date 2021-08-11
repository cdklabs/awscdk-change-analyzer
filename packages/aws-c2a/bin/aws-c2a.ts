#!/usr/bin/env node
import * as cxapi from '@aws-cdk/cx-api';
import * as yargs from 'yargs';
import { C2AToolkit, CloudAssembly, DefaultC2AHost, FAIL_ON } from '../lib';
import { print } from '../lib/private/logging';
import { versionNumber } from '../lib/private/version';
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-shadow */ // yargs

const failConditions: ReadonlyArray<FAIL_ON> = [ FAIL_ON.ALL, FAIL_ON.HIGH, FAIL_ON.UNKNOWN_AND_HIGH ];

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
    .usage('Usage: aws-c2a COMMAND')
    .command('diff --app <cdk-app> [STACKS..]', 'Compares the cdk app the deployed stack or a local template file', yargs => yargs
      .option('app', { type: 'string', alias: 'a', desc: 'REQUIRED: Path to your cloud assembly directory (e.g. "assembly-Pipeline-Stage/")', requiresArg: true, demandOption: true })
      .option('out', { type: 'string', alias: 'o', desc: 'The output file after running the diff', requiresArg: true, default: 'report.json' })
      .option('rules-path', { type: 'string', alias: 'r', desc: 'The rules that you want to diff against', requiresArg: true })
      .option('fail', { type: 'boolean', desc: 'Fail with exit code 1 if changes detected', default: false })
      .option('broadening-permissions', { type: 'boolean', desc: 'Add base rules to detect broadening permssions', default: false })
      .option('fail-condition', { choices: failConditions, desc: 'Configure the risk outputs that cause failure', default: FAIL_ON.HIGH }),
    )
    .command('gen --report <report-path>', 'Generate an html file that aggregates the output of aws-c2a diff', yargs => yargs
      .option('report', { type: 'string', alias: 'r', desc: 'REQUIRED: The file path to the change report', requiresArg: true, demandOption: true })
      .option('out', { type: 'string', alias: 'o', desc: 'The generated html file', requiresArg: true, default: 'index.html' }),
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
  const asm = argv.app ? new CloudAssembly(new cxapi.CloudAssembly(argv.app)) : undefined;
  const cli = new C2AToolkit(host, asm);

  switch (command) {
    case 'diff': {
      if (asm === undefined) {
        yargs.showHelp();
        print('\nMissing required argument: app');
        return 1;
      }
      return cli.c2aDiff({
        stackNames: (argv.STACKS || []) as string[],
        rulesPath: argv['rules-path'],
        outputPath: argv.out,
        fail: argv.fail,
        broadeningPermissions: argv['broadening-permissions'],
        failCondition: argv['fail-condition'],
      });
    }
    case 'gen': {
      return cli.c2aGen({
        reportPath: argv.report,
        outputPath: argv.out,
      });
    }
    default: {
      throw new Error('Received unknown command: ' + command);
    }
  }
}

main()
  .then(value => {
    process.exitCode = value;
  })
  .catch(err => {
    print(err);
    process.exitCode = 1;
  });