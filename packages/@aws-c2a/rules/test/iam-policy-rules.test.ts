import { InfraModel, OperationType } from '@aws-c2a/models';
import { CFParser } from '@aws-c2a/engine';
import { copy } from '../lib/private/object';
import { IAM_INLINE_IDENTITY_POLICIES, IAM_INLINE_RESOURCE_POLICIES, IAM_MANAGED_POLICIES, IAM_POLICY_RESOURCES } from '../lib/private/security-policies';
import { arbitraryPolicyStatement, behavior, cfnWithPolicyDocument, arbitraryNegativePolicyStatement, THEN_expectResource, THEN_expectNoResults, THEN_expectProperty } from './utils';

const BEFORE: Record<any, any> = { Resources: {} };
const ALLOW = { value: 'Allow' };
const DENY = { value: 'Deny' };

let oldModel: InfraModel;
beforeAll(() => {
  oldModel = new CFParser('root', BEFORE).parse();
});

describe('policy resources', () => {
  IAM_POLICY_RESOURCES.slice(-1).forEach(resource => {
    behavior(`new resource ${resource}`, (suite) => {
      suite.allow(() => {
        const {after, _oldModel} = GIVEN(arbitraryPolicyStatement);
        THEN_expectResource(after, _oldModel, OperationType.INSERT, [{value: 'Allow'}]);
      });

      suite.deny(() => {
        const {after, _oldModel} = GIVEN(arbitraryNegativePolicyStatement);
        THEN_expectNoResults(after, _oldModel);
      });

      function GIVEN(statement: any) {
        const after = copy(BEFORE);
        after.Resources[resource.replace(/::/g, '-')] = {
          Type: resource,
          Properties: { PolicyDocument: { Statement: [statement] } },
        };
        return {after, _oldModel: oldModel};
      }
    });

    behavior(`addition to statement property in ${resource}`, (suite) => {
      suite.allow(() => {
        const {after, _oldModel} = GIVEN(arbitraryPolicyStatement);
        THEN_expectProperty(after, _oldModel, OperationType.INSERT, [ALLOW]);
      });

      suite.deny(() => {
        const {after, _oldModel} = GIVEN(arbitraryNegativePolicyStatement);
        THEN_expectNoResults(after, _oldModel);
      });

      function GIVEN (statement: any) {
        const id = resource.replace(/::/g, '-');
        const before = cfnWithPolicyDocument(BEFORE, resource);
        const _oldModel = new CFParser('root', before).parse();

        const after = copy(before);
        after.Resources[id].Properties.PolicyDocument.Statement.push(statement);
        return {after, _oldModel};
      }
    });

    behavior(`update to existing policy statement in ${resource}`, (suite) => {
      suite.allow(() => {
        const {after, _oldModel} = GIVEN(arbitraryNegativePolicyStatement, arbitraryPolicyStatement);
        THEN_expectProperty(after, _oldModel, OperationType.UPDATE, [ALLOW, DENY]);
      });

      suite.deny(() => {
        const {after, _oldModel} = GIVEN(arbitraryPolicyStatement, arbitraryNegativePolicyStatement);
        THEN_expectNoResults(after, _oldModel);
      });

      function GIVEN(oldStatement: any, newStatement: any) {
        const id = resource.replace(/::/g, '-');
        const before = cfnWithPolicyDocument(BEFORE, resource);
        before.Resources[id].Properties.PolicyDocument.Statement[0] = oldStatement;
        const _oldModel = new CFParser('root', before).parse();

        const after = copy(before);
        after.Resources[id].Properties.PolicyDocument.Statement[0] = newStatement;
        return {after, _oldModel};
      }
    });
  });
});

describe('lambda permissions', () => {
  const resource = 'AWS::Lambda::Permission';
  test('adding new lambda permissions is detected', () => {
    // GIVEN
    const after = copy(BEFORE);
    after.Resources.LambdaPermission = {
      Type: resource,
      Properties: { FunctionName: 'Test' },
    };

    THEN_expectResource(after, oldModel, OperationType.INSERT, [{ value: 'Test' }]);
  });

  test('removing lambda permission is ignored', () => {
    // GIVEN
    const before = copy(BEFORE);
    before.Resources.LambdaPermission = {
      Type: resource,
      Properties: { },
    };
    const _oldModel = new CFParser('root', before).parse();

    THEN_expectNoResults(BEFORE, _oldModel);
  });
});

describe('managed policy properties', () => {
  Object.entries(IAM_MANAGED_POLICIES).slice(-1).forEach(([resource, policies]) => {
    policies.forEach(policy => {
      test(`detect addition of new ${resource} resource`, () => {
        // GIVEN
        const id = resource.replace(/::/g, '-');
        const after = copy(BEFORE);
        after.Resources[id] = {
          Type: resource,
          Properties: { [policy]: ['123456789'] },
        };

        // THEN
        THEN_expectResource(after, oldModel, OperationType.INSERT, [{value: '123456789'}]);
      });

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

        THEN_expectProperty(after, _oldModel, OperationType.INSERT, [{ value: 'abcdefghi' }]);
      });
    });
  });
});

describe('inline identity policy properties', () => {
  Object.entries(IAM_INLINE_IDENTITY_POLICIES).slice(-1).forEach(([resource, policies]) => {
    policies.forEach(_policy => {
      behavior(`addition to statement property in ${resource} resource`, (suite) => {
        suite.allow(() => {
          const {after, _oldModel} = GIVEN(arbitraryPolicyStatement);
          THEN_expectProperty(after, _oldModel, OperationType.INSERT, [ALLOW]);
        });

        suite.deny(() => {
          const {after, _oldModel} = GIVEN(arbitraryNegativePolicyStatement);
          THEN_expectNoResults(after, _oldModel);
        });

        function GIVEN(statement: any) {
          const id = resource.replace(/::/g, '-');
          const before = copy(BEFORE);
          before.Resources[id] = {
            Type: resource,
            Properties: { Policies: [ { PolicyDocument: { Statement: [ arbitraryPolicyStatement ] } } ] },
          };
          const _oldModel = new CFParser('root', before).parse();

          const after = copy(before);
          after.Resources[id].Properties.Policies[0].PolicyDocument.Statement.push(statement);
          return {after, _oldModel};
        }
      });

      behavior(`addition to empty policies property in ${resource} resource`, (suite) => {
        suite.allow(() => {
          const {after, _oldModel} = GIVEN(arbitraryPolicyStatement);
          THEN_expectProperty(after, _oldModel, OperationType.INSERT, [ALLOW]);
        });

        suite.deny(() => {
          const {after, _oldModel} = GIVEN(arbitraryNegativePolicyStatement);
          THEN_expectNoResults(after, _oldModel);
        });

        function GIVEN(statement: any) {
          const id = resource.replace(/::/g, '-');
          const before = copy(BEFORE);
          before.Resources[id] = {
            Type: resource,
            Properties: { Policies: [] },
          };
          const _oldModel = new CFParser('root', before).parse();

          const after = copy(before);
          after.Resources[id].Properties.Policies.push({ PolicyDocument: { Statement: [ statement ] } });
          return {after, _oldModel};
        }
      });

      behavior(`new ${resource} resource`, (suite) => {
        suite.allow(() => {
          const {after, _oldModel} = GIVEN(arbitraryPolicyStatement);
          THEN_expectResource(after, _oldModel, OperationType.INSERT, [{value: 'Allow'}]);
        });

        suite.deny(() => {
          const {after, _oldModel} = GIVEN(arbitraryNegativePolicyStatement);
          THEN_expectNoResults(after, _oldModel);
        });

        function GIVEN(statement: any) {
          const id = resource.replace(/::/g, '-');
          const after = copy(BEFORE);
          after.Resources[id] = {
            Type: resource,
            Properties: {
              Policies: [ { PolicyDocument: { Statement: [statement] } } ],
            },
          };

          return {after, _oldModel: oldModel};
        }
      });
    });
  });
});

describe('inline resource policy properties', () => {
  Object.entries(IAM_INLINE_RESOURCE_POLICIES).slice(-1).forEach(([resource, policies]) => {
    policies.forEach(policy => {
      behavior(`new ${resource} resource and statement property, ${policy},`, (suite) => {
        suite.allow(() => {
          const {after, _oldModel} = GIVEN(arbitraryPolicyStatement);
          THEN_expectResource(after, _oldModel, OperationType.INSERT, [{value: 'Allow'}]);
        });

        suite.deny(() => {
          const {after, _oldModel} = GIVEN(arbitraryNegativePolicyStatement);
          THEN_expectNoResults(after, _oldModel);
        });

        function GIVEN(statement: any) {
          const id = resource.replace(/::/g, '-');
          const after = copy(BEFORE);
          after.Resources[id] = {
            Type: resource,
            Properties: { [policy]: { Statement: [ statement ] } },
          };

          return {after, _oldModel: oldModel};
        }
      });

      behavior(`addition to statement property, ${policy}, in ${resource}`, (suite) => {
        suite.allow(() => {
          const {after, _oldModel} = GIVEN(arbitraryPolicyStatement);
          THEN_expectProperty(after, _oldModel, OperationType.INSERT, [ALLOW]);
        });

        suite.deny(() => {
          const {after, _oldModel} = GIVEN(arbitraryNegativePolicyStatement);
          THEN_expectNoResults(after, _oldModel);
        });

        function GIVEN(statement: any) {
          const id = resource.replace(/::/g, '-');
          const before = copy(BEFORE);
          before.Resources[id] = {
            Type: resource,
            Properties: { [policy]: { Statement: [ arbitraryPolicyStatement ] } },
          };
          const _oldModel = new CFParser('root', before).parse();

          const after = copy(before);
          after.Resources[id].Properties[policy].Statement.push(statement);

          return {after, _oldModel};
        }
      });

      behavior(`update to statement property, ${policy}, in ${resource}`, (suite) => {
        suite.allow(() => {
          const {after, _oldModel} = GIVEN(arbitraryNegativePolicyStatement, arbitraryPolicyStatement);
          THEN_expectProperty(after, _oldModel, OperationType.UPDATE, [ALLOW, DENY]);
        });

        suite.deny(() => {
          const {after, _oldModel} = GIVEN(arbitraryPolicyStatement, arbitraryNegativePolicyStatement);
          THEN_expectNoResults(after, _oldModel);
        });

        function GIVEN(oldPolicy: any, newPolicy: any) {
          const id = resource.replace(/::/g, '-');
          const before = copy(BEFORE);
          before.Resources[id] = {
            Type: resource,
            Properties: { [policy]: { Statement: [ oldPolicy ] } },
          };
          const _oldModel = new CFParser('root', before).parse();

          const after = copy(before);
          after.Resources[id].Properties[policy].Statement[0] = newPolicy;

          return {after, _oldModel};
        }
      });
    });
  });
});