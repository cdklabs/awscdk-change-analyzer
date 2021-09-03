import { CUserRules } from '@aws-c2a/rules';

export class PresetRules {

  private _rules: CUserRules = [];
  get rules(): CUserRules {
    return this._rules;
  }

  public constructor(...rules: CUserRules) {
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

