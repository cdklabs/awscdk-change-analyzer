import { Change, Component } from '.';
import { CRuleCondition, RuleConditionOperator, Scalar } from '../user-configuration';

export interface ConditionOptions {
  sourcePath?: string[];
  targetPath?: string[];
}

export class Condition {
  public readonly source: Change;
  public readonly operator: RuleConditionOperator;
  public readonly target: Component | Scalar;
  public readonly sourcePath: string[];
  public readonly targetPath: string[];

  constructor(source: Change, operator: RuleConditionOperator, target: Component | Scalar, options?: ConditionOptions) {
    this.source = source;
    this.operator = operator;
    this.target = target;
    this.sourcePath = options?.sourcePath ?? [];
    this.targetPath = options?.targetPath ?? [];
  }

  public generateCondition(): CRuleCondition {
    let target: Scalar;
    const source = this.sourcePath.length > 0
      ? `${this.source.id}.${this.sourcePath.join('.')}`
      : this.source.id;

    if (this.target instanceof Component) {
      target = this.targetPath.length > 0
        ? `${this.target.id}.${this.targetPath.join('.')}`
        : this.target.id;
    } else if (typeof this.target === 'string') {
      target = `'${this.target}'`;
    } else {
      target = this.target;
    }

    return `${source} ${this.operator} ${target}`;
  }
}