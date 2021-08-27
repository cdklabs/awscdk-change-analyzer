import { OperationType, RuleRisk } from '@aws-c2a/models';
import {
  IAM_INLINE_IDENTITY_POLICIES,
  IAM_INLINE_RESOURCE_POLICIES,
  IAM_LAMBDA_PERMISSION,
  IAM_MANAGED_POLICIES,
  IAM_POLICY_RESOURCES,
} from '../private/security-policies';
import { CUserRule, CUserRules } from '../user-configuration';
import { Change, ChangeType } from './change';
import { Component } from './component';
import { ConditionOptions } from './condition';
import { Rule } from './rule';

interface ChangeRuleOptions {
  target: string;
  propertyOperationType?: OperationType;
  type?: OperationType;
  changeId?: string;
  where?: string[];
}

interface ResourceRuleOptions {
  identifier: string;
  resource: string;
  then: ChangeRuleOptions[];
}

export class SecurityChangesRules {
  /**
   * Rules that pertain to broadening permissions for
   * EC2 security group changes.
   */
  public static BroadeningSecurityGroup(): SecurityChangesRules {
    const rules = new SecurityChangesRules();
    const securityGroup = rules._createResourceRule({
      identifier: 'securityGroup',
      resource: 'AWS::EC2::SecurityGroup',
      then: [
        { propertyOperationType: OperationType.INSERT, target: 'securityGroup.Properties.SecurityGroupEngress' },
        { propertyOperationType: OperationType.INSERT, target: 'securityGroup.Properties.SecurityGroupIngress' },
      ],
    });
    const securityGroupResources = ['Ingress', 'Egress'].map(type => rules._createResourceRule({
      identifier: `securityGroup${type}`,
      resource: `AWS::EC2::SecurityGroup${type}`,
      then: [ { type: OperationType.INSERT, target: `securityGroup${type}` } ],
    }));
    rules.addRules(securityGroup, ...securityGroupResources);
    return rules;
  }
  /**
   * Rules that pertain to broadening permissions for
   * IAM policy/statement changes.
   */
  public static BroadeningIamPermissions(): SecurityChangesRules {
    const rules = new SecurityChangesRules();
    const rootBindings = new Rule([Change.INSERT, Change.INSERT_PROP, Change.UPDATE_PROP]);

    function generateComponent(resource: string): { component: Component, rule: Rule } {
      const identifier = resource.replace(/::/g, '');
      const component = Component.fromResource(identifier, resource);
      const rule = rootBindings.createChild({ bindings: [component] });
      return { component, rule };
    }

    // Lambda Permissions
    IAM_LAMBDA_PERMISSION.forEach(resource => {
      const { component, rule: componentBindings } = generateComponent(resource);
      generateHighRiskChild(componentBindings, component, {
        change: Change.INSERT,
      });
    });

    // Managed Policies
    Object.entries(IAM_MANAGED_POLICIES).forEach(([resource, policies]) => {
      const { component, rule: componentBindings } = generateComponent(resource);
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
      const { component, rule: componentBindings } = generateComponent(resource);
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
      const { component, rule: componentBindings } = generateComponent(resource);
      policies.forEach(policy => {
        generateStatementRules(componentBindings, component, policy);
      });
    });

    // Policy Resources
    IAM_POLICY_RESOURCES.forEach(resource => {
      const { component, rule: componentBindings } = generateComponent(resource);
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

  private _rules: CUserRules;
  get rules(): CUserRules {
    return this._rules;
  }

  constructor() {
    this._rules = [];
  }

  public addRules(...rules: CUserRule[]): void {
    this._rules.push(...rules);
  }

  /**
   * An opinionated utility that creates nested change
   * rules for a given resource.
   */
  private _createResourceRule(options: ResourceRuleOptions): CUserRule {
    return {
      let: { [options.identifier]: { Resource: options.resource } },
      then: options.then.map(opts => this._createChangeRule(opts)),
    };
  }

  /**
   * An opinionated utility that wil produce a high risk change
   * rule that applies to a given target.
   */
  private _createChangeRule(options: ChangeRuleOptions): CUserRule {
    const {target, where, ...opts} = options;
    const id = options.changeId ?? 'change';
    const rule: any = {
      let: { [id]: { change: { ...opts }, where: [`${id} appliesTo ${target}`, ...(where ?? [])] } },
      effect: { risk: RuleRisk.High },
    };
    return rule;
  }

}

/**
 * Generates a string array to represent the path to the PolicyDocument for statements.
 *
 * For example the path to a PolicyDocument for inline identity policies are the following:
 * ```json
 * // AWS::IAM::User
 * "Properties": {
 *   "Policies": [{
 *     "PolicyDocument": {
 *       "Statement": [
 *         {...}
 *       ]
 *     }
 *   }]
 * }
 * ```
 * The query for this path would be: `this._generateStatementPath('PolicyDocument', 'Policies', '*')`
 *
 * Some policies call the PolicyDocument by another name:
 * ```json
 * // AWS::IAM::Policy
 * "Properties": {
 *   "AssumeRolePolicyDocument": {
 *     "Statement": [
 *       {...}
 *     ]
 *   }
 * }
 * ```
 * The query for this path would be: `this._generateStatementPath('AssumeRolePolicyDocument')`
 *
 * @param documentName the key for the policy document [default: PolicyDocument]
 * @param propertyPrefix the strings that prefix the policy document
 *
 * @returns a property path with the form
 * ['Properties', ...propertyPrefix, documentName, 'Statement', '*']
 */
function generateStatementPath(documentName = 'PolicyDocument', ...propertyPrefix: string[]): string[] {
  return ['Properties', ...propertyPrefix, documentName, 'Statement', '*'];
}

/**
 * See {@link generateStatementPath}.
 *
 * @param documentName the key for the policy document [default: PolicyDocument]
 * @param propertyPrefix the strings that prefix the policy document
 *
 * @returns a property path with the form
 * ['Properties', ...propertyPrefix, documentName, 'Statement', '*', 'Effect']
 */
function generateEffectPath(documentName = 'PolicyDocument', ...propertyPrefix: string[]): string [] {
  return [...generateStatementPath(documentName, ...propertyPrefix), 'Effect'];
}

function generateStatementRules(parent: Rule, component: Component, documentName = 'PolicyDocument', ...prefix: string[]) {
  generateHighRiskChild(parent, component, {
    change: Change.INSERT,
    equals: 'Allow',
    sourcePath: generateEffectPath(documentName, ...prefix),
  });
  generateHighRiskChild(parent, component, {
    change: Change.INSERT_PROP,
    equals: 'Allow',
    targetPath: generateStatementPath(documentName, ...prefix),
    sourcePath: ['Effect'],
  });
  generateHighRiskChild(parent, component, {
    change: Change.UPDATE_PROP,
    equals: 'Allow',
    targetPath: generateStatementPath(documentName, ...prefix),
    sourcePath: ['Effect'],
  });
}

interface HighRiskChildOptions extends ConditionOptions {
  change: Change;
  equals?: string;
}

function generateHighRiskChild(parent: Rule, component: Component, {change, ...options}: HighRiskChildOptions): void {
  parent.createChild({
    conditions: [
      change.appliesTo(component, { targetPath: options?.targetPath }),
      ...(options.equals ? [change.equals(options.equals, ChangeType.NEW, { sourcePath: options?.sourcePath })] : []),
    ],
    risk: RuleRisk.High,
    target: change,
  });
}
