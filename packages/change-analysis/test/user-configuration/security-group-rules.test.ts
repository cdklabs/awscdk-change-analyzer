import * as fs from 'fs';
import { InfraModel, JSONSerializer, Transition } from 'cdk-change-analyzer-models';
import { createChangeAnalysisReport } from '../../lib/change-analysis-report/create-change-analysis-report';
import { DiffCreator } from '../../lib/model-diffing';
import { CFParser } from '../../lib/platform-mapping';
import { SecurityChangesRules } from '../../lib/security-changes';
import { CUserRules, RuleProcessor, parseRules, UserRules } from '../../lib/user-configuration';

const BEFORE = {
  Resources: {
    SecurityGroup: {
      Type: 'AWS::EC2::SecurityGroup',
      Properties: {
        SecurityGroupEgress: [ { CidrIp: '0.0.0.0/0', IpProtocol: '-1' } ],
        SecurityGroupIngress: [ { CidrIp: '0.0.0.0/0', IpProtocol: '-1' } ],
      },
    },
  },
};

function processRules(oldModel: InfraModel, newModel: InfraModel, rules: CUserRules) {
  const diff = new DiffCreator(new Transition({ v1: oldModel, v2: newModel })).create();
  const _rules: UserRules = parseRules(rules);
  return new RuleProcessor(diff.generateOutgoingGraph()).processRules(_rules);
}

export function generateReport(oldModel: InfraModel, newModel: InfraModel, rules: CUserRules) {
  const report = createChangeAnalysisReport(new Transition({ v1: oldModel, v2: newModel }), rules);
  fs.writeFileSync('report.json', new JSONSerializer().serialize(report));
}

const copy = (source: any) => {
  return JSON.parse(JSON.stringify(source));
};

describe('EC2 Security Group default rules', () => {
  let rules: CUserRules;
  let oldModel: InfraModel;
  beforeAll(() => {
    rules = SecurityChangesRules.BroadeningSecurityGroup().rules;
    oldModel = new CFParser('oldRoot', BEFORE).parse();
  });

  test('detect full additions to security group property: egress ', () => {
    // GIVEN
    const after = copy(BEFORE);

    after.Resources.SecurityGroup.Properties.SecurityGroupEgress.push(
      { CidrIp: '0.0.0.1/0', IpProtocol: '-1' },
    );

    // WHEN
    const newModel = new CFParser('newRoot', after).parse();
    const result = processRules(oldModel, newModel, rules);

    // THEN
    expect(result.size).toBe(1);
  });

  test('detect full additions to security group property: ingress', () => {
    // GIVEN
    const after = copy(BEFORE);

    after.Resources.SecurityGroup.Properties.SecurityGroupIngress.push(
      { CidrIp: '0.0.0.1/0', IpProtocol: '-1' },
    );

    // WHEN
    const newModel = new CFParser('newRoot', after).parse();
    const result = processRules(oldModel, newModel, rules);

    // THEN
    expect(result.size).toBe(1);
  });

  test('detect inserts to security group egress', () => {
    // GIVEN
    const after = copy(BEFORE);

    after.Resources.SecurityGroupEgress = {
      Type: 'AWS::EC2::SecurityGroupEgress',
      Properties: {
        GroupId: '123456789',
        IpProtocol: 'tcp',
      },
    };

    // WHEN
    const newModel = new CFParser('newRoot', after).parse();
    const result = processRules(oldModel, newModel, rules);

    // THEN
    expect(result.size).toBe(1);
  });

  test('detect inserts to security group egress', () => {
    // GIVEN
    const after = copy(BEFORE);

    after.Resources.SecurityGroupIngress = {
      Type: 'AWS::EC2::SecurityGroupIngress',
      Properties: {
        IpProtocol: 'tcp',
      },
    };

    // WHEN
    const newModel = new CFParser('newRoot', after).parse();
    const result = processRules(oldModel, newModel, rules);

    // THEN
    expect(result.size).toBe(1);
  });
});