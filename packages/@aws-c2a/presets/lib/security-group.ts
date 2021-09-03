import { Change, Rule } from '@aws-c2a/rules';
import { generateComponent, generateHighRiskChild } from './generators';
import { PresetRules } from './preset-rules';

export class SecurityGroup extends PresetRules {
  /**
   * Rules that pertain to broadening permissions for
   * EC2 security group changes.
   */
  public static BroadeningPermissions(): PresetRules {
    const rules = new SecurityGroup();
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
}

