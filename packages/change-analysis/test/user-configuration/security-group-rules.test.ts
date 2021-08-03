import { InfraModel } from '../../../change-analysis-models';
import { CFParser } from '../../lib/platform-mapping';
import { copy } from '../../lib/private/object';
import { SecurityChangesRules } from '../../lib/security-changes';
import { CUserRules } from '../../lib/user-configuration';
import { processRules } from './util';

describe('EC2 Security Group default rules', () => {
  const BEFORE: Record<any, any> = {
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

  let rules: CUserRules;
  let oldModel: InfraModel;
  beforeAll(() => {
    rules = SecurityChangesRules.BroadeningSecurityGroup().rules;
    oldModel = new CFParser('root', BEFORE).parse();
  });

  test('detect full additions to security group property: egress ', () => {
    // GIVEN
    const after = copy(BEFORE);

    after.Resources.SecurityGroup.Properties.SecurityGroupEgress.push(
      { CidrIp: '0.0.0.1/0', IpProtocol: '-1' },
    );

    // WHEN
    const newModel = new CFParser('root', after).parse();
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
    const newModel = new CFParser('root', after).parse();
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
    const newModel = new CFParser('root', after).parse();
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
    const newModel = new CFParser('root', after).parse();
    const result = processRules(oldModel, newModel, rules);

    // THEN
    expect(result.size).toBe(1);
  });
});
