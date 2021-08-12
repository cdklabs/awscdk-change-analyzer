import { Construct } from 'constructs';
import * as fs from 'fs';
import * as path from 'path';
import * as s3 from '@aws-cdk/aws-s3';
import { App, AppProps, Environment, Stage, Stack, StackProps, StageProps } from '@aws-cdk/core';
import * as cxapi from '@aws-cdk/cx-api';

export function assemblyBuilderOf(stage: Stage): cxapi.CloudAssemblyBuilder {
  return (stage as any)._assemblyBuilder;
}
export const PIPELINE_ENV: Environment = {
  account: '123pipeline',
  region: 'us-pipeline',
};

export class TestApp extends App {
  constructor(props?: Partial<AppProps>) {
    super({
      context: {
        '@aws-cdk/core:newStyleStackSynthesis': '1',
      },
      stackTraces: false,
      autoSynth: false,
      treeMetadata: false,
      ...props,
    });
  }

  public stackArtifact(stackName: string | Stack) {
    if (typeof stackName !== 'string') {
      stackName = stackName.stackName;
    }

    this.synth();
    const supportStack = this.node.findAll().filter(Stack.isStack).find(s => s.stackName === stackName);
    expect(supportStack).not.toBeUndefined();
    return supportStack;
  }

  public cleanup() {
    rimraf(assemblyBuilderOf(this).outdir);
  }
}

export class OneStackApp extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);
    new BucketStack(this, 'Stack');
  }
}

/**
 * A test stack
 */
 export class BucketStack extends Stack {
  public readonly bucket: s3.IBucket;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    this.bucket = new s3.Bucket(this, 'Bucket');
  }
}

/**
 * rm -rf reimplementation, don't want to depend on an NPM package for this
 */
export function rimraf(fsPath: string) {
  try {
    const isDir = fs.lstatSync(fsPath).isDirectory();

    if (isDir) {
      for (const file of fs.readdirSync(fsPath)) {
        rimraf(path.join(fsPath, file));
      }
      fs.rmdirSync(fsPath);
    } else {
      fs.unlinkSync(fsPath);
    }
  } catch (e) {
    // We will survive ENOENT
    if (e.code !== 'ENOENT') { throw e; }
  }
}
