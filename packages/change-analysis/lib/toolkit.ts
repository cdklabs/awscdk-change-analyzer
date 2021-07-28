import * as fs from 'fs';
import { ChangeAnalysisReport, groupArrayBy, JSONSerializer, RuleRisk, Transition } from 'cdk-change-analyzer-models';
import { IC2AHost } from './c2a-host';
import { CfnTraverser } from './cfn-traverser';
import { createChangeAnalysisReport } from './change-analysis-report/create-change-analysis-report';
import { CloudAssembly, DefaultSelection } from './cloud-assembly';
import { CDKParser } from './platform-mapping';
import { error } from './private/logging';
import { CUserRules } from './user-configuration';
import { flattenObjects, mapObjectValues } from './private/object';

export interface TemplateTree {
  readonly rootTemplate: any;
  readonly nestedTemplates?: {[id: string]: TemplateTree};
}

export enum FAIL_ON {
  HIGH='HIGH',
  UNKNOWN_AND_HIGH='UNKNOWN and HIGH',
  ALL='ALL',
}

export interface DiffOptions {
  stackNames: string[];
  rulesPath: string;
  outputPath: string;
  failCondition?: FAIL_ON;
}

export interface EvaluateDiffOptions {
  before: {[stackName: string]: TemplateTree};
  after: {[stackName: string]: TemplateTree};
  rules: CUserRules;
}

/**
 * The toolkit for utilizing c2a.
 */
export class C2AToolkit {
  private readonly asm: CloudAssembly;
  private readonly traverser: CfnTraverser;

  constructor(asm: CloudAssembly, host: IC2AHost) {
    this.asm = asm;
    this.traverser = new CfnTraverser(host, asm);
  }

  /**
   * Given the before/after forms of two template trees and
   * a list of rules, return the change analysis report.
   *
   * @param options the options for evaluation
   */
  public async evaluateStacks(options: EvaluateDiffOptions): Promise<ChangeAnalysisReport> {
    const {before, after} = options;

    const flattenNestedStacks = (nestedStacks: {[id: string]: TemplateTree} | undefined ): {[id: string]: any}  => {
      return Object.entries(nestedStacks ?? {})
        .reduce((acc, [stackName, {rootTemplate, nestedTemplates}]: [string, TemplateTree]) =>
          ({...acc, [stackName]: rootTemplate, ...(flattenNestedStacks(nestedTemplates))}), {});
    };

    const oldModel = new CDKParser('root', ...mapObjectValues(before, tree => tree.rootTemplate)).parse({
      nestedStacks: flattenObjects(mapObjectValues(before, app => flattenNestedStacks(app.nestedTemplates))),
    });

    const newModel = new CDKParser('root', ...mapObjectValues(after, tree => tree.rootTemplate)).parse({
      nestedStacks: flattenObjects(mapObjectValues(after, app => flattenNestedStacks(app.nestedTemplates))),
    });

    return createChangeAnalysisReport(new Transition({v1: oldModel, v2: newModel}), options.rules);
  }

  public async c2aDiff(options: DiffOptions) {
    const selectedStacks = await this.selectStacks(options.stackNames);

    const before: {[stackName: string]: TemplateTree} = {};
    const after: {[stackName: string]: TemplateTree} = {};
    const rules = JSON.parse(await fs.promises.readFile(options.rulesPath, 'utf-8'));
    const outputPath = options.outputPath;

    for (const stack of selectedStacks.stackArtifacts) {
      const stackName = stack.stackName;
      before[stackName] = await this.traverser.traverseCfn(stackName);
      after[stackName] = await this.traverser.traverseLocal(stack.templateFile);
    }

    const report = await this.evaluateStacks({ before, after, rules });

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

    await fs.promises.writeFile(outputPath, new JSONSerializer().serialize(report));

    switch (options.failCondition) {
      case FAIL_ON.ALL: {
        return evaluateAggregations(
          `Changes detected. Your changes fall under ${options.failCondition} rules.`,
          RuleRisk.Low, RuleRisk.Unknown, RuleRisk.High,
        );
      }
      case FAIL_ON.UNKNOWN_AND_HIGH: {
        return evaluateAggregations(
          `Unknown/high risk changes detected. Your changes fall under ${options.failCondition} rules.`,
          RuleRisk.Unknown, RuleRisk.High,
        );
      }
      case FAIL_ON.HIGH: {
        return evaluateAggregations(
          `High risk changes detected. Your changes fall under ${options.failCondition} rules.`,
          RuleRisk.High,
        );
      }
      default: {
        return 0;
      }
    }
  }

  private async selectStacks(stackNames: string[]) {
    return await this.asm.selectStacks({ patterns: stackNames }, {
      defaultBehavior: DefaultSelection.AllStacks,
    });
  }
}
