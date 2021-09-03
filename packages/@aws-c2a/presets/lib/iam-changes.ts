import { RuleRisk } from '@aws-c2a/models';
import { Change, ChangeType, Rule } from '@aws-c2a/rules';
import { generateComponent, generateHighRiskChild, generateStatementRules } from './generators';
import { PresetRules } from './preset-rules';
import {
  IAM_INLINE_IDENTITY_POLICIES,
  IAM_INLINE_RESOURCE_POLICIES,
  IAM_LAMBDA_PERMISSION,
  IAM_MANAGED_POLICIES,
  IAM_POLICY_RESOURCES,
} from './private/security-policies';

/**
 * A class containing static presets that represent levels
 * of permissions.
 */
export class IamChanges extends PresetRules {
  /**
   * Rules that pertain to broadening permissions for
   * IAM policy/statement changes.
   */
  public static BroadeningPermissions(): PresetRules {
    const rules = new IamChanges();
    const rootBindings = new Rule([Change.INSERT, Change.INSERT_PROP, Change.UPDATE_PROP]);

    // Lambda Permissions
    IAM_LAMBDA_PERMISSION.forEach(resource => {
      const { component, rule: componentBindings } = generateComponent(resource, rootBindings);
      generateHighRiskChild(componentBindings, component, {
        change: Change.INSERT,
      });
    });

    // Managed Policies
    Object.entries(IAM_MANAGED_POLICIES).forEach(([resource, policies]) => {
      const { component, rule: componentBindings } = generateComponent(resource, rootBindings);
      policies.forEach(policy => {
        generateHighRiskChild(componentBindings, component, {
          change: Change.INSERT_PROP,
          targetPath: ['Properties', policy, '*'],
        });
        generateHighRiskChild(componentBindings, component, {
          change: Change.INSERT,
          equals: '*',
          sourcePath: ['Properties', policy, '*'],
        });
        componentBindings.createChild({
          conditions: [
            Change.INSERT.appliesTo(component),
            Change.INSERT.equals('*', ChangeType.NEW, { sourcePath: ['Properties', policy, '*'] }),
          ],
          risk: RuleRisk.High,
          target: Change.INSERT,
        });
      });
    });

    // Inline Identity Policies
    Object.entries(IAM_INLINE_IDENTITY_POLICIES).forEach(([resource, policies]) => {
      const { component, rule: componentBindings } = generateComponent(resource, rootBindings);
      policies.forEach(policy => {
        generateStatementRules(componentBindings, component, 'PolicyDocument', policy, '*');
        generateHighRiskChild(componentBindings, component, {
          change: Change.INSERT_PROP,
          equals: 'Allow',
          targetPath: ['Properties', policy, '*'],
          sourcePath: ['PolicyDocument', 'Statement', '*'],
        });
      });
    });

    // Inline Resource Policies
    Object.entries(IAM_INLINE_RESOURCE_POLICIES).forEach(([resource, policies]) => {
      const { component, rule: componentBindings } = generateComponent(resource, rootBindings);
      policies.forEach(policy => {
        generateStatementRules(componentBindings, component, policy);
      });
    });

    // Policy Resources
    IAM_POLICY_RESOURCES.forEach(resource => {
      const { component, rule: componentBindings } = generateComponent(resource, rootBindings);
      generateStatementRules(componentBindings, component);
    });

    rules.addRules(rootBindings.toJSON());
    return rules;
  }
}

