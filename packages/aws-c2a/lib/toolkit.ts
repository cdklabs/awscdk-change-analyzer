import * as fs from 'fs';
import { createChangeAnalysisReport } from '@aws-c2a/engine';
import { ChangeAnalysisReport, groupArrayBy, JSONSerializer, RuleRisk, Transition } from '@aws-c2a/models';
import { BroadeningPermissions } from '@aws-c2a/presets';
import { CUserRules } from '@aws-c2a/rules';
import { IC2AHost } from './c2a-host';
import { CfnTraverser } from './cfn-traverser';
import { CloudAssembly, DefaultSelection, StackCollection } from './cloud-assembly';
import { getFileIfExists } from './private/fs';
import { warning, error } from './private/logging';
import { createModel, TemplateTree, TemplateTreeMap } from './private/toolkit-utils';
const webappTemplatePath = require.resolve('@aws-c2a/web-app/fixtures/template.index.html');
const visTemplatePath = require.resolve('@aws-c2a/visualizer/fixtures/template.index.html');

export enum FAIL_ON {
  HIGH='HIGH',
  UNKNOWN_AND_HIGH='UNKNOWN and HIGH',
  ALL='ALL',
}

export interface DiffOptions {
  stackNames: string[];
  outputPath: string;
  fail: boolean;
  rulesPath?: string;
  broadeningPermissions?: boolean;
  failCondition?: FAIL_ON;
}

export interface HtmlOptions {
  reportPath: string;
  outputPath: string;
}

export interface VisOptions {
  stackNames: string[];
  outputPath: string;
}

export interface TemplateTreeDiff {
  before: TemplateTreeMap;
  after: TemplateTreeMap;
}

export interface EvaluateDiffOptions extends TemplateTreeDiff {
  rules: CUserRules;
}

/**
 * The toolkit for utilizing c2a.
 */
export class C2AToolkit {
  private readonly _host: IC2AHost;
  private _asm?: CloudAssembly;
  private _traverser?: CfnTraverser;

  constructor(host: IC2AHost, asm?: CloudAssembly) {
    this._host = host;
    this._asm = asm;
    this._traverser = asm ? new CfnTraverser(host, asm) : undefined;
  }

  public setAsm(_asm: CloudAssembly): void {
    this._asm = _asm;
  }

  private get asm(): CloudAssembly {
    if (!this._asm) {
      throw new Error('C2A Cloud Assembly not attached to Toolkit. Please attach the assembly to the toolkit.');
    }
    return this._asm;
  }

  private get traverser(): CfnTraverser {
    if (!this._traverser) {
      this._traverser = new CfnTraverser(this._host, this.asm);
    }
    return this._traverser;
  }

  public async c2aDiff(options: DiffOptions): Promise<number> {
    const outputPath = options.outputPath;

    const rules = [
      ...(options.broadeningPermissions ? BroadeningPermissions : []),
      ...(options.rulesPath ? JSON.parse(await fs.promises.readFile(options.rulesPath, 'utf-8')) : []),
    ];

    if (rules.length === 0) {
      warning('No rules are configured. Run with c2a diff with `--broadening-permissions` or `--rules-path` to analyze the risk of your changes.');
    }

    const { before, after } = await this.getTemplateTrees(options.stackNames);
    const report = await this.evaluateStacks({ before, after, rules });
    await fs.promises.writeFile(outputPath, new JSONSerializer().serialize(report));
    return this.evaluateReport(report, options.failCondition) && options.fail ? 1 : 0;
  }

  public async c2aHtml(options: HtmlOptions): Promise<number> {
    const report = JSON.stringify(await getFileIfExists(options.reportPath, 'Rule Set'));
    const template = await getFileIfExists(webappTemplatePath, 'C2A Web App Template');
    const webapp = template.replace('"!!!CDK_CHANGE_ANALYSIS_REPORT"', report);
    await fs.promises.writeFile(options.outputPath, webapp);
    return 0;
  }

  public async c2aVis(options: VisOptions): Promise<number> {
    const { before, after } = await this.getTemplateTrees(options.stackNames);
    const template = await getFileIfExists(visTemplatePath, 'C2A Visualizer Template');
    const firstTemplate = (map: TemplateTreeMap): any => Object.values(map)[0].rootTemplate;
    const visualizer = template
      .replace('"!!!CDK_CHANGE_ANALYSIS_BEFORE"', JSON.stringify(firstTemplate(before)))
      .replace('"!!!CDK_CHANGE_ANALYSIS_AFTER"', JSON.stringify(firstTemplate(after)));
    await fs.promises.writeFile(options.outputPath, visualizer);
    return 0;
  }

  /**
   * Given the before/after forms of two template trees and
   * a list of rules, return the change analysis report.
   *
   * @param options the options for evaluation
   */
  public async evaluateStacks(options: EvaluateDiffOptions): Promise<ChangeAnalysisReport> {
    const {before, after} = options;
    const oldModel = createModel(before);
    const newModel = createModel(after);

    return createChangeAnalysisReport(new Transition({v1: oldModel, v2: newModel}), options.rules);
  }

  /**
   * Evaluates a change report against a fail condition. If no fail condition is
   * provided, we return success.
   *
   * @param report The change report to evaluate
   * @param failCondition The conditions that can cause failure
   */
  private evaluateReport(report: ChangeAnalysisReport, failCondition?: FAIL_ON) {
    if (!failCondition)
      return 0;

    const aggregationMap = groupArrayBy(report.aggregations, (agg) => agg.characteristics.RISK);
    const aggregations = {
      high: aggregationMap.get(RuleRisk.High)?.[0]?.subAggs ?? [],
      low: aggregationMap.get(RuleRisk.Low)?.[0]?.subAggs ?? [],
      unknown: aggregationMap.get(RuleRisk.Unknown)?.[0]?.subAggs ?? [],
    };

    const evaluateAggregations = (errorMessage: string, ...filter: RuleRisk[]) => {
      const filteredAggregations: {[key: string]: number} = Object.entries(aggregations)
        .filter(([risk, values]) => filter.includes(risk as RuleRisk) && (values?.length ?? 0) > 0)
        .reduce((acc, [risk, values]) => ({...acc, [risk]: values?.length ?? 0}), {});

      if (Object.values(filteredAggregations).length > 0) {
        const frequencyReport = Object.entries(filteredAggregations)
          .reduce((acc, [risk, frequency]) => `${acc}\n * ${risk}: ${frequency}`, 'Risk Aggregation Report:');
        error(`${errorMessage}\n\n${frequencyReport}`);
        return 1;
      }
      return 0;
    };

    switch (failCondition) {
      case FAIL_ON.ALL: {
        return evaluateAggregations(
          `Changes detected. Your changes fall under ${failCondition} rules.`,
          RuleRisk.Low, RuleRisk.Unknown, RuleRisk.High,
        );
      }
      case FAIL_ON.UNKNOWN_AND_HIGH: {
        return evaluateAggregations(
          `Unknown/high risk changes detected. Your changes fall under ${failCondition} rules.`,
          RuleRisk.Unknown, RuleRisk.High,
        );
      }
      case FAIL_ON.HIGH: {
        return evaluateAggregations(
          `High risk changes detected. Your changes fall under ${failCondition} rules.`,
          RuleRisk.High,
        );
      }
      default: { return 0; }
    }
  }

  private async getTemplateTrees(stackNames: string[]): Promise<TemplateTreeDiff> {
    const selectedStacks = await this.selectStacks(stackNames);
    const before: {[stackName: string]: TemplateTree} = {};
    const after: {[stackName: string]: TemplateTree} = {};
    for (const stack of selectedStacks.stackArtifacts) {
      const stackName = stack.stackName;
      before[stackName] = await this.getCfnTemplate(stackName);
      after[stackName] = await this.traverser.traverseLocal(stack.templateFile);
    }
    return { before, after };
  }

  /**
   * A get method for cfn templates that won't error for non-existing
   * stacks.
   *
   * @param stackName StackName to retrieve
   * @returns The CFN stack related to the stack name, if the stack
   * is not found return an empty template tree
   */
  private async getCfnTemplate(stackName: string): Promise<any> {
    try {
      return await this.traverser.traverseCfn(stackName);
    } catch (e) {
      if (e.code === 'ValidationError' && e.message === `Stack with id ${stackName} does not exist`) {
        return { rootTemplate: {} };
      }
      throw e;
    }
  }

  private async selectStacks(stackNames: string[]): Promise<StackCollection> {
    return await this.asm.selectStacks({ patterns: stackNames }, {
      defaultBehavior: DefaultSelection.AllStacks,
    });
  }
}
