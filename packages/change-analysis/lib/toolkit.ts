import * as fs from 'fs';
import { JSONSerializer, Transition } from 'cdk-change-analyzer-models';
import { IC2AHost } from './c2a-host';
import { CfnTraverser } from './cfn-traverser';
import { createChangeAnalysisReport } from './change-analysis-report/create-change-analysis-report';
import { CloudAssembly, DefaultSelection } from './cloud-assembly';
import { CDKParser } from './platform-mapping';
import { CUserRules } from './user-configuration';

export interface TemplateTree {
  readonly rootTemplate: any;
  readonly nestedTemplates?: {[id: string]: TemplateTree};
}

export interface DiffOptions {
  stackNames: string[];
  rulesPath: string;
  outputPath?: string;
}

export interface EvaluateDiffOptions {
  before: {[stackName: string]: TemplateTree};
  after: {[stackName: string]: TemplateTree};
  rules: CUserRules;
}

export class C2AToolkit {
  private readonly asm: CloudAssembly;
  private readonly traverser: CfnTraverser;

  constructor(asm: CloudAssembly, host: IC2AHost) {
    this.asm = asm;
    this.traverser = new CfnTraverser(host, asm);
  }

  public async evaluateStacks(options: EvaluateDiffOptions) {
    const oldStack = Object.values(options.before)[0];
    const newStack = Object.values(options.after)[0];

    const flattenNestedStacks = (nestedStacks: {[id: string]: TemplateTree} | undefined ): {[id: string]: any}  => {
      return Object.entries(nestedStacks ?? {})
        .reduce((acc, [stackName, {rootTemplate, nestedTemplates}]: [string, TemplateTree]) => {
          return {...acc, [stackName]: rootTemplate, ...(flattenNestedStacks(nestedTemplates))};
        }, {});
    };

    const oldModel = new CDKParser(oldStack.rootTemplate).parse({
      nestedStacks: flattenNestedStacks(oldStack.nestedTemplates),
    });
    const newModel = new CDKParser(newStack.rootTemplate).parse({
      nestedStacks: flattenNestedStacks(newStack.nestedTemplates),
    });

    return createChangeAnalysisReport(new Transition({v1: oldModel, v2: newModel}), options.rules);
  }

  public async c2aDiff(options: DiffOptions) {
    const selectedStacks = await this.selectStacks(options.stackNames);

    const before: {[stackName: string]: TemplateTree} = {};
    const after: {[stackName: string]: TemplateTree} = {};
    for (const stack of selectedStacks.stackArtifacts) {
      const stackName = stack.stackName;
      before[stackName] = await this.traverser.traverseLocal(stack.templateFile);
      after[stackName] = await this.traverser.traverseCfn(stackName);
    }

    const rules = JSON.parse(await fs.promises.readFile(options.rulesPath, 'utf-8'));

    const report = await this.evaluateStacks({
      before,
      after,
      rules,
    });

    const outputPath = options.outputPath ?? 'report.json';
    return fs.promises.writeFile(outputPath, new JSONSerializer().serialize(report));
  }

  private async selectStacks(stackNames: string[]) {
    return await this.asm.selectStacks({ patterns: stackNames }, {
      defaultBehavior: DefaultSelection.AllStacks,
    });
  }
}
