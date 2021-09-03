import { RuleRisk } from '@aws-c2a/models';
import { Change, ChangeType, Component, Rule } from '@aws-c2a/rules';

/**
 * Options for generating high risk childs.
 */
export interface HighRiskChildOptions {
  /**
   * The change to applies to the component and
   * the target for the rule.
   */
  change: Change;
  /**
   * Check if the `change.new` is equal this option.
   */
  equals?: string;
  /**
   * The path for the **component** during the appliesTo condition.
   *
   * For example, to check if the property IamPolicy.Properties.PolicyDocument.Statement.*
   * has changed, we would write the following:
   *
   * generateHighRiskChild(parentRule, component, {
   *   change: Change.ALL,
   *   targetPath: ['Properties', 'PolicyDocument', 'Statement', '*'],
   * })
   */
  targetPath?: string[];
  /**
   * The path for the **change** during the equals condition.
   *
   * For example, to check if the property `change.new.Effect`
   * is equal to 'Allow', for all changes that happpen to the
   * `PolicyDocument.Statement` array, we would write something
   * like the following:
   *
   * generateHighRiskChild(parentRule, component, {
   *   change: Change.ALL,
   *   equals: 'Allow'
   *   targetPath: ['Properties', 'PolicyDocument', 'Statement', '*'],
   *   sourcePath: ['Effect']
   * })
   */
  sourcePath?: string[];
}

/**
 * An opinionated generator that creates a child rule that flags
 * a change that applies to a component as high risk.
 *
 * If given an `equals` option, the generator will also apply
 * an equals condition for greater specificity.
 *
 * @param parent The parent child to derive from
 * @param component The component the change is applied to
 * @param options Options that define the change and conditions
 */
export function generateHighRiskChild(parent: Rule, component: Component, options: HighRiskChildOptions): void {
  const { change } = options;
  parent.createChild({
    conditions: [
      change.appliesTo(component, { targetPath: options.targetPath }),
      ...(options.equals
        ? [change.equals(options.equals, ChangeType.NEW, { sourcePath: options.sourcePath })]
        : []),
    ],
    risk: RuleRisk.High,
    target: change,
  });
}
