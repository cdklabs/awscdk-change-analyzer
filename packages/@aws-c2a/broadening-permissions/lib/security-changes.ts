import { RuleRisk } from '@aws-c2a/models';
import { CUserRule, CUserRules, Change, ChangeType, Rule } from '@aws-c2a/rules';
import { generateComponent, generateHighRiskChild, generateStatementRules } from './generators';
import {
  IAM_INLINE_IDENTITY_POLICIES,
  IAM_INLINE_RESOURCE_POLICIES,
  IAM_LAMBDA_PERMISSION,
  IAM_MANAGED_POLICIES,
  IAM_POLICY_RESOURCES,
} from './private/security-policies';

export class SecurityChangesRules {
  /**
   * Rules that pertain to broadening permissions for
   * EC2 security group changes.
   */
  public static BroadeningSecurityGroup(): SecurityChangesRules {
    const rules = new SecurityChangesRules();
    const rootBindings = new Rule([Change.ALL, Change.INSERT]);
    const { component: securityGroup, rule: sgBindings } = generateComponent('AWS::EC2::SecurityGroup', rootBindings);
    ['Ingress', 'Egress'].forEach(type => {
      const { component, rule: componentBindings } = generateComponent(`AWS::EC2::SecurityGroup${type}`, rootBindings);

      generateHighRiskChild(componentBindings, component, {
        change: Change.ALL,
      });
      generateHighRiskChild(sgBindings, securityGroup, {
        change: Change.INSERT,
        equals: '*',
        sourcePath: ['Properties', `SecurityGroup${type}`, '*'],
      });
      generateHighRiskChild(sgBindings, securityGroup, {
        change: Change.ALL,
        targetPath: ['Properties', `SecurityGroup${type}`, '*'],
      });
    });
    rules.addRules(rootBindings.toJSON());
    return rules;
  }
  /**
   * Rules that pertain to broadening permissions for
   * IAM policy/statement changes.
   */
  public static BroadeningIamPermissions(): SecurityChangesRules {
    const rules = new SecurityChangesRules();
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
  public static BroadeningPermissions(): SecurityChangesRules {
    const rules = new SecurityChangesRules();
    rules.addRules(
      ...SecurityChangesRules.BroadeningSecurityGroup().rules,
      ...SecurityChangesRules.BroadeningIamPermissions().rules,
    );
    return rules;
  }

  private _rules: CUserRules = [];
  get rules(): CUserRules {
    return this._rules;
  }

  constructor(...rules: CUserRules) {
    this.addRules(...rules);
  }

  public addRules(...rules: CUserRules): void {
    this._rules.push(...rules);
  }

  public toString(prettier = false): string {
    return prettier
      ? JSON.stringify(this.rules, null, 2)
      : JSON.stringify(this.rules);
  }
}

