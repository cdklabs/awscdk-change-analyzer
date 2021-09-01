import { RuleAction, RuleRisk } from '@aws-c2a/models';
import { RuleConditions, RuleConditionOperator, UserRules } from '@aws-c2a/rules';
import { RuleProcessor } from '../../lib';
import { diffTestCase1 } from '../default-test-cases/infra-model-diff';

/**
 * Generates rules for example diff 1 with the specified conditions
 * @param t1
 * @param operator
 * @param t2
 * @returns
 */
function generateRulesWithConditions(conditions: RuleConditions): UserRules{
  return [{
    let: {
      role: { filter: { entityType: 'component', type: 'resource', subtype: 'AWS::IAM::Role' }},
      instance: { filter: { entityType: 'component', type: 'resource', subtype: 'AWS::EC2::Instance' } },
      construct: { filter: { entityType: 'component', type: 'construct' } },
      change: { filter: {entityType: 'change' }, where: conditions },
    },
    effect: {
      target: 'change',
      risk: RuleRisk.High,
      action: RuleAction.Reject,
    },
  }];
}

test('Rule processor condition with references operator', () => {

  const diff = diffTestCase1();

  const rules = generateRulesWithConditions([{
    leftInput: {identifier: 'instance'},
    operator: RuleConditionOperator.references,
    rightInput: {identifier: 'role'},
  }]);

  const result = new RuleProcessor(diff.generateOutgoingGraph()).processRules(rules);
  expect(result.size).toEqual(2);
});

test('Rule processor condition with references operator in opposite direction should fail', () => {

  const diff = diffTestCase1();

  const rules = generateRulesWithConditions([{
    leftInput: {identifier: 'role'},
    operator: RuleConditionOperator.references,
    rightInput: {identifier: 'instance'},
  }]);

  const result = new RuleProcessor(diff.generateOutgoingGraph()).processRules(rules);
  expect(result.size).toEqual(0);
});

test('Rule processor condition with isReferencedIn operator', () => {

  const diff = diffTestCase1();

  const rules = generateRulesWithConditions([{
    leftInput: {identifier: 'role'},
    operator: RuleConditionOperator.isReferencedIn,
    rightInput: {identifier: 'instance'},
  }]);

  const result = new RuleProcessor(diff.generateOutgoingGraph()).processRules(rules);
  expect(result.size).toEqual(2);
});

test('Rule processor condition with contains operator', () => {

  const diff = diffTestCase1();

  const rules = generateRulesWithConditions([{
    leftInput: {identifier: 'construct'},
    operator: RuleConditionOperator.contains,
    rightInput: {identifier: 'role'},
  }]);

  const result = new RuleProcessor(diff.generateOutgoingGraph()).processRules(rules);
  expect(result.size).toEqual(2);
});

test('Rule processor condition with contains operator finds nothing', () => {

  const diff = diffTestCase1();

  const rules = generateRulesWithConditions([{
    leftInput: {identifier: 'construct'},
    operator: RuleConditionOperator.contains,
    rightInput: {identifier: 'instance'},
  }]);

  const result = new RuleProcessor(diff.generateOutgoingGraph()).processRules(rules);
  expect(result.size).toEqual(0);
});

test('Rule processor condition with isContainedIn operator', () => {

  const diff = diffTestCase1();

  const rules = generateRulesWithConditions([{
    leftInput: {identifier: 'role'},
    operator: RuleConditionOperator.isContainedIn,
    rightInput: {identifier: 'construct'},
  }]);

  const result = new RuleProcessor(diff.generateOutgoingGraph()).processRules(rules);
  expect(result.size).toEqual(2);
});

test('Rule processor condition with contains operator should not match reference relationships', () => {

  const diff = diffTestCase1();

  const rules = generateRulesWithConditions([{
    leftInput: {identifier: 'instance'},
    operator: RuleConditionOperator.contains,
    rightInput: {identifier: 'role'},
  }]);

  const result = new RuleProcessor(diff.generateOutgoingGraph()).processRules(rules);
  expect(result.size).toEqual(0);
});