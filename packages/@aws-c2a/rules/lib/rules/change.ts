import { ModelEntityTypes, OperationType } from '@aws-c2a/models';
import { Bindable, Component, Condition, ConditionOptions } from '.';
import { CSelector, RuleConditionOperator, Scalar } from '../primitives';

export enum ChangeType {
  NEW = 'new',
  OLD = 'old',
}

export interface ChangeOptions {
  readonly type?: OperationType;
  readonly propertyOperationType?: OperationType;
  readonly conditions?: Condition[];
}

export class Change extends Bindable {
  public static ALL = new Change('ALL_CHANGES')
  public static INSERT = new Change('INSERT_COMPONENT', { type: OperationType.INSERT });
  public static UPDATE = new Change('UPDATE_COMPONENT', { type: OperationType.UPDATE });
  public static INSERT_PROP = new Change('INSERT_PROPERTY', { propertyOperationType: OperationType.INSERT });
  public static UPDATE_PROP = new Change('UPDATE_PROPERTY', { propertyOperationType: OperationType.UPDATE });

  public readonly type?: OperationType;
  public readonly propertyOperationType?: OperationType;
  public readonly where?: Condition[];

  constructor(id: string, options?: ChangeOptions) {
    super(id, ModelEntityTypes.change);
    this.type = options?.type;
    this.propertyOperationType = options?.propertyOperationType;
    this.where = options?.conditions;
  }

  public generateBinding(): CSelector {
    const bindings = super.generateBinding();
    if (this.where && typeof bindings !== 'string')
      bindings.where = this.where.map(c => c.generateCondition());
    return bindings;
  }

  public appliesTo(target: Component, options?: ConditionOptions): Condition {
    return new Condition(this, RuleConditionOperator.appliesTo, target, options);
  }

  public equals(target: Scalar, type: ChangeType, options?: ConditionOptions): Condition {
    return new Condition(this, RuleConditionOperator.equals, target, {
      sourcePath: [type, ...(options?.sourcePath ?? [])],
      targetPath: options?.targetPath,
    });
  }
}