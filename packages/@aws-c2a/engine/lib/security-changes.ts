import { OperationType, RuleRisk } from '@aws-c2a/models';
import {flatMap} from './private/node';
import { IAM_POLICY_PROPERTIES, IAM_POLICY_RESOURCES } from './private/security-policies';
import { CUserRule, CUserRules } from './user-configuration';

interface ChangeRuleOptions {
  target: string;
  propertyOperationType?: OperationType;
  type?: OperationType;
  changeId?: string;
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
    // Policy Properties
    rules.addRules(...Object.entries(IAM_POLICY_PROPERTIES).map(([resource, policies]) => {
      const identifier = resource.replace(/::/g, '');
      return rules._createResourceRule({
        identifier,
        resource,
        then: flatMap(policies, policy => [
          // Managed Policies
          {
            propertyOperationType: OperationType.INSERT,
            target: `${identifier}.Properties.${policy}`,
          },
          // Inline Identity Policies
          {
            propertyOperationType: OperationType.INSERT,
            target: `${identifier}.Properties.${policy}.Policies`,
          },
          // Inline Resource Policies
          {
            propertyOperationType: OperationType.INSERT,
            target: `${identifier}.Properties.${policy}.Statement`,
          },
        ]),
      });
    }));
    // Policy Resources
    rules.addRules(...IAM_POLICY_RESOURCES.map(resource => {
      const identifier = resource.replace(/::/g, '');
      return rules._createResourceRule({
        identifier,
        resource,
        then: [
          { type: OperationType.INSERT, target: identifier },
          {
            propertyOperationType: OperationType.INSERT,
            target: `${identifier}.Properties.PolicyStatement.Statement`,
          },
        ],
      });
    }));
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
    const {target, ...opts} = options;
    const id = options.changeId ?? 'change';
    return {
      let: { [id]: { change: { ...opts } } },
      where: `${id} appliesTo ${target}`,
      effect: { risk: RuleRisk.High },
    };
  }
}