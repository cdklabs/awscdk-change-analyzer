import * as fs from 'fs';
import { InfraModel, JSONSerializer, Transition } from '@aws-c2a/models';
import { createChangeAnalysisReport } from '../../lib/change-analysis-report/create-change-analysis-report';
import { DiffCreator } from '../../lib/model-diffing';
import { copy } from '../../lib/private/object';
import { CUserRules, RuleProcessor, parseRules, UserRules, RuleOutput } from '../../lib/user-configuration';

export function processRules(oldModel: InfraModel, newModel: InfraModel, rules: CUserRules) {
  const diff = new DiffCreator(new Transition({ v1: oldModel, v2: newModel })).create();
  const _rules: UserRules = parseRules(rules);
  const graph = diff.generateOutgoingGraph();
  return {
    graph,
    rulesOutput: new RuleProcessor(graph).processRules(_rules),
  };
}

export function generateReport(oldModel: InfraModel, newModel: InfraModel, rules: CUserRules) {
  const report = createChangeAnalysisReport(new Transition({ v1: oldModel, v2: newModel }), rules);
  fs.writeFileSync('report.json', new JSONSerializer().serialize(report));
}

export function cfnWithPolicyDocument(source: any, type: string, policy?: string) {
  const target = copy(source);
  const id = type.replace(/::/g, '-');
  const policyDocument = {
    PolicyDocument: {
      Statement: [ arbitraryPolicyStatement ],
    },
  };
  target.Resources[id] = {
    Type: type,
    Properties: {
      ...(policy ? { [policy]: policyDocument } : policyDocument),
    },
  };
  return target;
}

export const arbitraryPolicyStatement =  {
  Effect: 'Allow',
  Action: 'test:Test',
  Resource: '*',
  Principal: { Service: 'test.amazonaws.com' },
};

export const firstKey = (output: RuleOutput, findCb?: (out: any) => boolean) => {
  return findCb ? [...output][0][0]._out.find(findCb) : [...output][0][0];
};