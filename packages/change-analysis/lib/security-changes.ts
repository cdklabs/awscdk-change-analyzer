import { CUserRule, CUserRules } from "./user-configuration";
import { OperationType, RuleRisk } from 'cdk-change-analyzer-models';

export const broadeningSecurityGroup = [
  {
    "description": "Additions to EC2 Security Group Properites",
    "let": { "securityGroup": { "Resource": "AWS::EC2::SecurityGroup" } },
    "then": [
      {
        "description": "Full inserts to the SecurityGroupEgress Property",
        "let": { "change": { "change": { "propertyOperationType": "INSERT" } } },
        "where": "change appliesTo securityGroup.Properties.SecurityGroupEgress",
        "effect": { "risk": "high" }
      },
      {
        "description": "Full inserts to the SecurityGroupIngress Property",
        "let": { "change": { "change": { "propertyOperationType": "INSERT" } } },
        "where": "change appliesTo securityGroup.Properties.SecurityGroupingress",
        "effect": { "risk": "high" }
      }
    ]
  }
]

interface ChangeRuleOptions {
  propertyOperationType?: OperationType;
  type?: OperationType;
  target: string
}

interface ResourceRuleOptions {
  identifier: string;
  resource: string;
  then: ChangeRuleOptions[];
}

export class SecurityChangesRules {
  private _rules: CUserRules;

  get rules(): CUserRules {
    return this._rules;
  }

  public static BroadeningSecurityGroup() {
    const rules = new SecurityChangesRules();
    const securityGroup = rules._createResourceRule({
      identifier: 'securityGroup',
      resource: 'AWS::EC2::SecurityGroup',
      then: [
        { propertyOperationType: OperationType.INSERT, target: 'securityGroup.Properties.SecurityGroupEngress' },
        { propertyOperationType: OperationType.INSERT, target: 'securityGroup.Properties.SecurityGroupIngress' },
      ]
    });
    const securityGroupResources = ['Ingress', 'Egress'].map(type => rules._createResourceRule({
      identifier: `securityGroup${type}`,
      resource: `AWS::EC2::SecurityGroup${type}`,
      then: [ { type: OperationType.INSERT, target: `securityGroup${type}` } ],
    }));
    rules.addRules(securityGroup, ...securityGroupResources);

    return rules;
  }

  constructor() {
    this._rules = [];
  }

  private _createResourceRule(options: ResourceRuleOptions) {
    return {
      let: { [options.identifier]: { Resource: options.resource } },
      then: options.then.map(opts => this._createChangeRule(opts)),
    }
  }

  private _createChangeRule(options: ChangeRuleOptions): CUserRule {
    const {target, ...opts} = options;
    return {
      let: { change: { change: { ...opts } } },
      where: `change appliesTo ${target}`,
      effect: { risk: RuleRisk.High }
    };
  }

  public addRules(...rules: CUserRule[]) {
    this._rules.push(...rules);
  }
}