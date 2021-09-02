import { RuleRisk } from '@aws-c2a/models';
import { Change, ChangeType, Component, ConditionOptions, Rule } from '@aws-c2a/rules';

export interface HighRiskChildOptions extends ConditionOptions {
  change: Change;
  equals?: string;
}

export function generateHighRiskChild(parent: Rule, component: Component, options: HighRiskChildOptions): void {
  const { change } = options;
  parent.createChild({
    conditions: [
      change.appliesTo(component, { targetPath: options?.targetPath }),
      ...(options.equals
        ? [change.equals(options.equals, ChangeType.NEW, { sourcePath: options?.sourcePath })]
        : []),
    ],
    risk: RuleRisk.High,
    target: change,
  });
}
