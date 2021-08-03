import * as fs from 'fs';
import { InfraModel, JSONSerializer, Transition } from 'cdk-change-analyzer-models';
import { createChangeAnalysisReport } from '../../lib/change-analysis-report/create-change-analysis-report';
import { DiffCreator } from '../../lib/model-diffing';
import { copy } from '../../lib/private/object';
import { CUserRules, RuleProcessor, parseRules, UserRules } from '../../lib/user-configuration';

export function processRules(oldModel: InfraModel, newModel: InfraModel, rules: CUserRules) {
  const diff = new DiffCreator(new Transition({ v1: oldModel, v2: newModel })).create();
  const _rules: UserRules = parseRules(rules);
  return new RuleProcessor(diff.generateOutgoingGraph()).processRules(_rules);
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
