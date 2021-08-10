import { InfraModel } from '@aws-c2a/models';
import { CFParser } from '../../lib/platform-mapping';
import { copy } from '../../lib/private/object';
import { SecurityChangesRules } from '../../lib/security-changes';
import { CUserRules } from '../../lib/user-configuration';
import { firstKey, processRules } from '../utils';

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

  test('detect full additions to security group property: egress', () => {
    // GIVEN
    const after = copy(BEFORE);

    after.Resources.SecurityGroup.Properties.SecurityGroupEgress.push(
      { CidrIp: '0.0.0.1/0', IpProtocol: '-1' },
    );

    // WHEN
    const newModel = new CFParser('root', after).parse();
    const { graph: g, rulesOutput: result } = processRules(oldModel, newModel, rules);
    const firstVertex = firstKey(result)._id;

    // THEN
    expect(g.v(firstVertex).run()).toHaveLength(1);
    expect(g.v(firstVertex).run()[0]).toMatchObject({ propertyOperationType: 'INSERT' });
    expect(g.v(firstVertex).out('appliesTo').filter({entityType: 'property'}).run()).toMatchObject([
      {},
      { value: '-1' },
      { value: '0.0.0.1/0' },
    ]);
  });

  test('detect full additions to security group property: ingress', () => {
    // GIVEN
    const after = copy(BEFORE);

    after.Resources.SecurityGroup.Properties.SecurityGroupIngress.push(
      { CidrIp: '0.0.0.1/0', IpProtocol: '-1' },
    );

    // WHEN
    const newModel = new CFParser('root', after).parse();
    const { graph: g, rulesOutput: result } = processRules(oldModel, newModel, rules);
    const firstVertex = firstKey(result)._id;

    // THEN
    expect(g.v(firstVertex).run()).toHaveLength(1);
    expect(g.v(firstVertex).run()[0]).toMatchObject({ propertyOperationType: 'INSERT' });
    expect(g.v(firstVertex).out('appliesTo').filter({entityType: 'property'}).run()).toMatchObject([
      {},
      { value: '-1' },
      { value: '0.0.0.1/0' },
    ]);
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
    const { graph: g, rulesOutput: result } = processRules(oldModel, newModel, rules);
    const firstVertex = firstKey(result)._id;

    // THEN
    expect(g.v(firstVertex).run()).toHaveLength(1);
    expect(g.v(firstVertex).run()[0]).toMatchObject({ type: 'INSERT' });
    expect(g.v(firstVertex).out('appliesTo').run()).toMatchObject([{
      subtype: 'AWS::EC2::SecurityGroupEgress',
    }]);
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
    const { graph: g, rulesOutput: result } = processRules(oldModel, newModel, rules);
    const firstVertex = firstKey(result)._id;

    // THEN
    expect(g.v(firstVertex).run()).toHaveLength(1);
    expect(g.v(firstVertex).run()[0]).toMatchObject({ type: 'INSERT' });
    expect(g.v(firstVertex).out('appliesTo').run()).toMatchObject([{
      subtype: 'AWS::EC2::SecurityGroupIngress',
    }]);
  });
});
