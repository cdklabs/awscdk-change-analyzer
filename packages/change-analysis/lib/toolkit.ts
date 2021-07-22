import * as fs from 'fs';
import { Transition } from 'cdk-change-analyzer-models';
import { createChangeAnalysisReport } from './change-analysis-report/create-change-analysis-report';
import { CDKParser } from './platform-mapping';

export interface TemplateTree {
  readonly rootTemplate: any;
  readonly nestedTemplates?: {[id: string]: TemplateTree};
}

export interface diffOptions {
  before: {[stackName: string]: TemplateTree};
  after: {[stackName: string]: TemplateTree};
  rulesPath: string;
  outputPath?: string;
}

export interface IC2AHost {
  readonly describeStackResources: (stackName: string) => Promise<AWS.CloudFormation.StackResources | undefined>;
  readonly describeCfnStack: (stackName: string) => Promise<AWS.CloudFormation.Stack | undefined>;
  readonly getCfnTemplate: (stackName: string) => Promise<any>;
  readonly getS3Object: (url: string) => Promise<any>;
  readonly getLocalTemplate: (filePath: string) => Promise<any>;
}

export async function c2aDiff(options: diffOptions) {
  const oldStack = Object.values(options.before)[0];
  const newStack = Object.values(options.after)[0];

  const oldModel = new CDKParser(oldStack).parse();
  const newModel = new CDKParser(newStack).parse();

  const rules = JSON.parse(await fs.promises.readFile(options.rulesPath, 'utf8'));
  const changeReport = createChangeAnalysisReport(new Transition({v1: oldModel, v2: newModel}), rules);

  return changeReport;
}
