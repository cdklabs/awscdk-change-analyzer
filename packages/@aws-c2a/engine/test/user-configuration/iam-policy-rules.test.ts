import { InfraModel, RuleRisk } from '@aws-c2a/models';
import { CFParser } from '../../lib/platform-mapping';
import { copy } from '../../lib/private/object';
import { IAM_INLINE_IDENTITY_POLICIES, IAM_INLINE_RESOURCE_POLICIES, IAM_MANAGED_POLICIES, IAM_POLICY_RESOURCES } from '../../lib/private/security-policies';
import { SecurityChangesRules } from '../../lib/security-changes';
import { CUserRule, CUserRules } from '../../lib/user-configuration';
import { arbitraryPolicyStatement, cfnWithPolicyDocument, processRules, firstKey, arbitraryNegativePolicyStatement } from '../utils';

import {writeFileSync} from 'fs';

describe('IAM Policy default rules', () => {
  const BEFORE: Record<any, any> = { Resources: {} };

  let rules: CUserRules;
  let oldModel: InfraModel;
  beforeAll(() => {
    rules = SecurityChangesRules.BroadeningPermissions().rules;
    oldModel = new CFParser('root', BEFORE).parse();
  });

  describe('for policy resources', () => {
    IAM_POLICY_RESOURCES.slice(-1).forEach(resource => {
      test(`detect addition of ${resource} resource`, () => {
        const rule: any = {
          let: {
            r: { Resource: resource },
            change: {
              change: { propertyOperationType: 'INSERT' },
              where: [
                'change appliesTo r.Properties.PolicyDocument.Statment.*',
              ],
            },
          },
          effect: { risk: RuleRisk.High }
        };
        // GIVEN
        const after = copy(BEFORE);
        after.Resources[resource.replace(/::/g, '-')] = {
          Type: resource,
          Properties: { PolicyDocument: { Statement: [arbitraryPolicyStatement] } },
        };

        writeFileSync('data/before.json', JSON.stringify(BEFORE));
        writeFileSync('data/after.json', JSON.stringify(after));

        // WHEN
        const newModel = new CFParser('root', after).parse();
        const { graph: g, rulesOutput: result } = processRules(oldModel, newModel, [rule]);
        const firstVertex = firstKey(result)._id;

        // THEN
        expect(g.v(firstVertex).run()).toHaveLength(1);
        expect(g.v(firstVertex).run()[0]).toMatchObject({ propertyOperationType: 'INSERT' });
        expect(g.v(firstVertex).out('appliesTo').filter({entityType: 'component'}).run()).toMatchObject([
          { subtype: resource },
        ]);
      });

      test(`detect addition to allow policy statement in ${resource} resource`, () => {
        // GIVEN
        const id = resource.replace(/::/g, '-');
        const before = cfnWithPolicyDocument(BEFORE, resource);
        const _oldModel = new CFParser('root', before).parse();

        const after = copy(before);
        after.Resources[id].Properties.PolicyDocument.Statement.push(arbitraryPolicyStatement);

        // WHEN
        const newModel = new CFParser('root', after).parse();
        const { graph: g, rulesOutput: result } = processRules(_oldModel, newModel, rules);
        const firstVertex = firstKey(result)._id;

        // THEN
        expect(g.v(firstVertex).run()).toHaveLength(1);
        expect(g.v(firstVertex).run()[0]).toMatchObject({ propertyOperationType: 'INSERT' });
        expect(g.v(firstVertex).out('appliesTo').filter({entityType: 'property'}).run()).toMatchObject([
          {},
          { value: 'test.amazonaws.com' },
          { value: '*' },
          { value: 'test:Test' },
          { value: 'Allow' },
        ]);
      });

      test(`detect update to allow policy statement in ${resource} resource`, () => {
        // GIVEN
        const id = resource.replace(/::/g, '-');
        const before = cfnWithPolicyDocument(BEFORE, resource);
        const _oldModel = new CFParser('root', before).parse();

        const after = copy(before);
        after.Resources[id].Properties.PolicyDocument.Statement[0] = (arbitraryPolicyStatement);

        // WHEN
        const newModel = new CFParser('root', after).parse();
        const { graph: g, rulesOutput: result } = processRules(_oldModel, newModel, rules);
        const firstVertex = firstKey(result)._id;

        // THEN
        expect(g.v(firstVertex).run()).toHaveLength(1);
        expect(g.v(firstVertex).run()[0]).toMatchObject({ propertyOperationType: 'UPDATE' });
        expect(g.v(firstVertex).out('appliesTo').filter({entityType: 'property'}).outAny().run()).toMatchObject([
          {},
          { value: '*' },
          { value: 'test:Test' },
          { value: 'Allow' },
          { value: 'test.amazonaws.com' },
          {},
          { value: '*' },
          { value: 'test:Test' },
          { value: 'Deny' },
          { value: 'test.amazonaws.com' }
        ]);
      });

      test(`addiiton of negative statement to ${resource} not a high risk change`, () => {
        // GIVEN
        const id = resource.replace(/::/g, '-');
        const before = cfnWithPolicyDocument(BEFORE, resource);
        const _oldModel = new CFParser('oldStatementModel', before).parse();

        const after = copy(before);
        after.Resources[id].Properties.PolicyDocument.Statement.push(arbitraryNegativePolicyStatement);


        // WHEN
        const newModel = new CFParser('root', after).parse();
        const { graph: g, rulesOutput: result } = processRules(_oldModel, newModel, rules);

        // THEN
        expect(result.size).toEqual(0);
      });
    });
  });

  describe('for policy properties', () => {
    Object.entries(IAM_MANAGED_POLICIES).slice(-1).forEach(([resource, policies]) => {
      policies.forEach(policy => {
        test(`detect additions to managed policy arns in ${resource} resource`, () => {
          // GIVEN
          const id = resource.replace(/::/g, '-');
          const before = copy(BEFORE);
          before.Resources[id] = {
            Type: resource,
            Properties: { [policy]: ['123456789'] },
          };
          const _oldModel = new CFParser('root', before).parse();

          const after = copy(before);
          after.Resources[id].Properties[policy].push('abcdefghi');

          // WHEN
          const newModel = new CFParser('root', after).parse();
          const { graph: g, rulesOutput: result } = processRules(_oldModel, newModel, rules);
          const firstVertex = firstKey(result)._id;

          // THEN
          expect(g.v(firstVertex).run()).toHaveLength(1);
          expect(g.v(firstVertex).run()[0]).toMatchObject({ propertyOperationType: 'INSERT' });
          expect(g.v(firstVertex).out('appliesTo').filter({entityType: 'property'}).run()).toMatchObject([
            { value: 'abcdefghi' },
            { value: 'abcdefghi' }, // Unsure why there are two of these..
          ]);
        });
      });
    });

    Object.entries(IAM_INLINE_IDENTITY_POLICIES).slice(-1).forEach(([resource, policies]) => {
      policies.forEach(policy => {
        test(`detect statement additions to inline identity policies in ${resource} resource`, () => {
          // GIVEN
          const id = resource.replace(/::/g, '-');
          const before = copy(BEFORE);
          before.Resources[id] = {
            Type: resource,
            Properties: {
              [policy]: {
                Policies: [
                  {
                    PolicyDocument: { Statement: [ arbitraryPolicyStatement ] },
                  },
                ],
              },
            },
          };
          const _oldModel = new CFParser('root', before).parse();

          const after = copy(before);
          after.Resources[id].Properties[policy].Policies[0].PolicyDocument.Statement.push(arbitraryPolicyStatement);

          // WHEN
          const newModel = new CFParser('root', after).parse();
          const { graph: g, rulesOutput: result } = processRules(_oldModel, newModel, rules);
          const firstVertex = firstKey(result)._id;

          // THEN
          expect(g.v(firstVertex).run()).toHaveLength(1);
          expect(g.v(firstVertex).run()[0]).toMatchObject({ propertyOperationType: 'INSERT' });
          expect(g.v(firstVertex).out('appliesTo').filter({entityType: 'property'}).run()).toMatchObject([
            {},
            { value: 'test.amazonaws.com' },
            { value: '*' },
            { value: 'test:Test' },
            { value: 'Allow' },
          ]);
        });

        test(`detect policy additions to inline identity policies in ${resource} resource`, () => {
          // GIVEN
          const id = resource.replace(/::/g, '-');
          const before = copy(BEFORE);
          before.Resources[id] = {
            Type: resource,
            Properties: {
              [policy]: {
                Policies: [],
              },
            },
          };
          const _oldModel = new CFParser('root', before).parse();

          const after = copy(before);
          after.Resources[id].Properties[policy].Policies.push({
            PolicyDocument: {
              Statement: [arbitraryPolicyStatement],
            },
          });

          // WHEN
          const newModel = new CFParser('root', after).parse();
          const { graph: g, rulesOutput: result } = processRules(_oldModel, newModel, rules);
          const firstVertex = firstKey(result)._id;

          // THEN
          expect(g.v(firstVertex).run()).toHaveLength(1);
          expect(g.v(firstVertex).run()[0]).toMatchObject({ propertyOperationType: 'INSERT' });
          expect(g.v(firstVertex).out('appliesTo').filter({entityType: 'property'}).run()).toMatchObject([
            {},
            { value: 'test.amazonaws.com' },
            { value: '*' },
            { value: 'test:Test' },
            { value: 'Allow' },
          ]);
        });
      });
    });

    Object.entries(IAM_INLINE_RESOURCE_POLICIES).slice(-1).forEach(([resource, policies]) => {
      policies.forEach(policy => {
        test(`detect statement additions to inline resource policies in ${resource} resource`, () => {
          // GIVEN
          const id = resource.replace(/::/g, '-');
          const before = copy(BEFORE);
          before.Resources[id] = {
            Type: resource,
            Properties: {
              [policy]: {
                Statement: [ arbitraryPolicyStatement ],
              },
            },
          };
          const _oldModel = new CFParser('root', before).parse();

          const after = copy(before);
          after.Resources[id].Properties[policy].Statement.push(arbitraryPolicyStatement);

          // WHEN
          const newModel = new CFParser('root', after).parse();
          const { graph: g, rulesOutput: result } = processRules(_oldModel, newModel, rules);
          const firstVertex = firstKey(result)._id;

          // THEN
          expect(g.v(firstVertex).run()).toHaveLength(1);
          expect(g.v(firstVertex).run()[0]).toMatchObject({ propertyOperationType: 'INSERT' });
          expect(g.v(firstVertex).out('appliesTo').filter({entityType: 'property'}).run()).toMatchObject([
            {},
            { value: 'test.amazonaws.com' },
            { value: '*' },
            { value: 'test:Test' },
            { value: 'Allow' },
          ]);
        });
      });
    });
  });
});
