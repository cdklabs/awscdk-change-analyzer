export enum RuleRisk {
  Low = 'low',
  High = 'high',
  Unknown = 'unknown',
}

export enum RuleAction {
  Approve = 'approve',
  Reject = 'reject',
  None = 'none',
}

export type RuleEffect =
    ({ risk: RuleRisk; action?: RuleAction }
    | { risk?: RuleRisk; action: RuleAction });