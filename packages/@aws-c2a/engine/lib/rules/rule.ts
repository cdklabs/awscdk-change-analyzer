import { RuleRisk } from '@aws-c2a/models';
import { Bindable, Change, Condition } from '.';
import { CUserRule, Scalar } from '../user-configuration';

export interface RuleOptions {
  conditions?: Condition[];
  nestedRules?: Rule[];
  parent?: Rule;
  risk?: RuleRisk;
  target?: Bindable;
}

export interface CreateChildOptions {
  bindings?: Bindable[];
  conditions?: Condition[];
  risk?: RuleRisk;
  target?: Bindable;
}

export class Rule {

  public static fromParent(parent: Rule, options?: CreateChildOptions): Rule {
    const rule = new Rule(options?.bindings ?? [], {parent, ...options});
    parent.addNestedRules(rule);
    return rule;
  }

  private _bindings: {[id: string]: Bindable} = {};
  get bindings(): Bindable[] {
    return Object.values(this._bindings);
  }

  private _conditions: Condition[] = [];
  get conditions(): Condition[] {
    return this._conditions;
  }

  private _nestedRules: Rule[] = [];
  get nestedRules(): Rule[] {
    return this._nestedRules;
  }

  private _parentBindings: {[id: string]: Bindable} = {};
  get parentBindings(): Bindable[] {
    return Object.values(this._parentBindings);
  }

  public readonly risk?: RuleRisk;
  public readonly target?: Bindable;

  constructor(bindings: Bindable[], options?: RuleOptions) {
    this.addBindings(...bindings);
    options?.parent && this.setParent(options.parent);
    this.addConditions(...(options?.conditions ?? []));
    this.addNestedRules(...(options?.nestedRules ?? []));
    this.risk = options?.risk;
    this.target = options?.target;
  }

  public addBindings(...bindings: Bindable[]): void {
    bindings.forEach((binding) => {
      const id = binding.id;
      if (id in this._bindings)
        throw new Error(`The 'let' scope must contain unique ids. Duplicate binding id: ${id}`);
      if (id in this._parentBindings)
        throw new Error(`Child ids must be unique to the parent scope. Duplicate binding id: ${id}`);
      this._bindings[id] = binding;
    });
  }

  public addConditions(...conditions: Condition[]): void {
    this.verifyConditions(conditions);
    this._conditions.push(...conditions);
  }

  public addNestedRules(...rules: Rule[]): void {
    rules.forEach(rule => {
      rule.setParent(this);
      this._nestedRules.push(rule);
    });
  }

  public setParent(parent: Rule): void {
    const bindings = [...parent.parentBindings, ...parent.bindings];
    this._parentBindings = bindings.reduce((acc, binding) => {
      const id = binding.id;
      if (id in this._bindings)
        throw new Error(`Parent bindings have duplicate id with existing child id. Duplicate binding id: ${id}`);
      return {...acc, [id]: binding };
    }, {});
  }

  public createChild(options: CreateChildOptions): Rule {
    const rule = Rule.fromParent(this, options);
    return rule;
  }

  public toJSON(): CUserRule {
    const bindingConditions = this.bindings.reduce((acc: Condition[], change: Bindable) => {
      if (change instanceof Change) return [...acc, ...(change.where ?? [])];
      else return acc;
    }, []);
    this.verifyConditions(bindingConditions);
    return {
      let: this.bindings.reduce((acc, binding) => ({
        ...acc,
        [binding.id]: binding.generateBinding(),
      }), {}),
      ...removeEmpty({ then: this.nestedRules.map(r => r.toJSON()) }),
      ...removeEmpty({ where: this.conditions.map(c => c.generateCondition()) }),
      ...(this.risk ? { effect: { risk: this.risk, target: this.target?.id } } : {}),
    };
  }

  private verifyConditions(conditions: Condition[]) {
    const check = (target: Bindable | Scalar): boolean => {
      if (typeof target === 'object' && !(target.id in this._bindings || target.id in this._parentBindings))
        throw new Error(`Conditions must refer to identifiers defined in rule bindings, received: ${target.id}`);
      return true;
    };
    conditions.forEach(c => check(c.source) && check(c.target));
  }
}

const removeEmpty = <T>(obj: {[key: string]: T}): {[key: string]: T} => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (typeof value === 'object' && (Object.keys(value).length === 0)) return {};
    return {...acc, ...(value ? {[key]: value} : {})};
  }, {});
};