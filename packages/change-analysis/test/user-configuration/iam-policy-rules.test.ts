import { InfraModel } from '../../../change-analysis-models';
import { CFParser } from '../../lib/platform-mapping';
import { copy } from '../../lib/private/object';
import { IAM_INLINE_IDENTITY_POLICIES, IAM_INLINE_RESOURCE_POLICIES, IAM_MANAGED_POLICIES, IAM_POLICY_RESOURCES } from '../../lib/private/security-policies';
import { SecurityChangesRules } from '../../lib/security-changes';
import { CUserRules } from '../../lib/user-configuration';
import { arbitraryPolicyStatement, cfnWithPolicyDocument, processRules } from './util';

describe('IAM Policy default rules', () => {
  const BEFORE: Record<any, any> = { Resources: {} };

  let rules: CUserRules;
  let oldModel: InfraModel;
  beforeAll(() => {
    rules = SecurityChangesRules.BroadeningIamPermissions().rules;
    oldModel = new CFParser('root', BEFORE).parse();
  });

  describe('for policy resources', () => {
    IAM_POLICY_RESOURCES.slice(-1).forEach(resource => {
      test(`detect addition of ${resource} resource`, () => {
        // GIVEN
        const after = copy(BEFORE);

        after.Resources[resource.replace(/::/g, '-')] = {
          Type: resource,
          Properties: {},
        };

        // WHEN
        const newModel = new CFParser('root', after).parse();
        const result = processRules(oldModel, newModel, rules);

        // THEN
        expect(result.size).toBe(1);
      });

      test(`detect addition to policy statement in ${resource} resource`, () => {
        // GIVEN
        const id = resource.replace(/::/g, '-');
        const before = cfnWithPolicyDocument(BEFORE, resource);
        const _oldModel = new CFParser('oldStatementModel', before).parse();

        const after = copy(before);
        after.Resources[id].Properties.PolicyDocument.Statement.push(arbitraryPolicyStatement);

        // WHEN
        const newModel = new CFParser('root', after).parse();
        const result = processRules(_oldModel, newModel, rules);

        // THEN
        expect(result.size).toBe(1);
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
          const result = processRules(_oldModel, newModel, rules);

          // THEN
          expect(result.size).toBe(1);
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
          const result = processRules(_oldModel, newModel, rules);

          // THEN
          expect(result.size).toBe(1);
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
          const result = processRules(_oldModel, newModel, rules);

          // THEN
          expect(result.size).toBe(1);
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
          const result = processRules(_oldModel, newModel, rules);

          // THEN
          expect(result.size).toBe(1);
        });
      });
    });
  });
});
