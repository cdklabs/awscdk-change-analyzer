import { DiffCreator, RuleProcessor, parseRules, RuleOutput } from '@aws-c2a/engine';
import { InfraModel, Transition } from '@aws-c2a/models';
import { CUserRules, UserRules } from '@aws-c2a/rules';
import { Graph } from 'fifinet';
import { copy } from '../../lib/private/object';

interface ProcessRulesOutput {
  graph: Graph<any, {_label: string, _in: string, _out: string}>;
  rulesOutput: RuleOutput;
}

export function processRules(oldModel: InfraModel, newModel: InfraModel, rules: CUserRules): ProcessRulesOutput {
  const diff = new DiffCreator(new Transition({ v1: oldModel, v2: newModel })).create();
  const _rules: UserRules = parseRules(rules);
  const graph = diff.generateOutgoingGraph();
  return {
    graph,
    rulesOutput: new RuleProcessor(graph).processRules(_rules),
  };
}

export function cfnWithPolicyDocument(source: any, type: string, policy?: string): any {
  const target = copy(source);
  const id = type.replace(/::/g, '-');
  const policyDocument = {
    PolicyDocument: {
      Statement: [ arbitraryNegativePolicyStatement ],
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

export const arbitraryPolicyStatement = {
  Effect: 'Allow',
  Action: 'test:Test',
  Resource: '*',
  Principal: { Service: 'test.amazonaws.com' },
};

export const arbitraryNegativePolicyStatement = {
  Effect: 'Deny',
  Action: 'test:Test',
  Resource: '*',
  Principal: { Service: 'test.amazonaws.com' },
};


export const firstKey = (output: RuleOutput, findCb?: (out: any) => boolean): any => {
  return findCb ? [...output][0][0]._out.find(findCb) : [...output][0][0];
};