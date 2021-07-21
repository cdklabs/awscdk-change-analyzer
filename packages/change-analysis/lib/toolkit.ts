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

export interface ICfnHost {
  readonly getCfnTemplate: (stackName: string) => Promise<any>;
}

export interface IS3Host {
  readonly getS3Object: (url: string) => Promise<any>;
}

export interface IC2AHost extends ICfnHost, IS3Host {
  readonly getLocalTemplate: (filePath: string) => Promise<any>;
}

export async function c2aDiff(options: diffOptions, host: IC2AHost) {
  const oldStack = Object.values(options.before)[0];
  const newStack = Object.values(options.after)[0];

  const oldModel = new CDKParser(oldStack).parse();
  const newModel = new CDKParser(newStack).parse();

  const rules = JSON.parse(await fs.promises.readFile(options.rulesPath, 'utf8'));
  const changeReport = createChangeAnalysisReport(new Transition({v1: oldModel, v2: newModel}), rules);

  return changeReport;
}
