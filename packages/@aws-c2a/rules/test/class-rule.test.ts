import { OperationType, RuleRisk } from '@aws-c2a/models';
import { Rule, Component, ComponentType, Change } from '../lib';

describe('Rule class', () => {
  let component: Component;
  let change: Change;
  beforeAll(() => {
    // GIVEN
    change = new Change('change', { type: OperationType.INSERT });
    component = new Component('r', ComponentType.RESOURCE, 'AWS::IAM::Policy');
  });

  test('errors when binding contains duplicate ids', () => {
    // WHEN
    const dup1 = () => new Rule([component, component]);
    const dup2 = () => new Rule([component, new Component('r', ComponentType.PARAMETER, 'Test')]);

    // THEN
    expect(dup1).toThrowError('The \'let\' scope must contain unique ids. Duplicate binding id: r');
    expect(dup2).toThrowError('The \'let\' scope must contain unique ids. Duplicate binding id: r');
  });

  test('generates correct binding for component', () => {
    // WHEN
    const rule = new Rule([component]);

    // THEN
    expect(rule.toJSON()).toMatchObject({
      let: { r: { component: { type: 'Resource', subtype: 'AWS::IAM::Policy' } } },
    });
  });

  test('generates correct output for condition', () => {
    // WHEN
    const rule = new Rule([change, component], {
      risk: RuleRisk.High,
      conditions: [change.appliesTo(component)],
    });

    // THEN
    expect(rule.toJSON()).toMatchObject({
      let: {
        r: { component: { type: 'Resource', subtype: 'AWS::IAM::Policy' } },
        change: { change: { type: 'INSERT' } },
      },
      where: [ 'change appliesTo r' ],
      effect: { risk: 'high' },
    });
  });

  test('generates correct output for condition w/ path', () => {
    // WHEN
    const rule = new Rule([change, component], {
      risk: RuleRisk.High,
      conditions: [
        change.appliesTo(component, {
          targetPath: ['Properties', 'PolicyDocument', 'Statement', '*', 'Effect'],
        },
        )],
    });

    // THEN
    expect(rule.toJSON()).toMatchObject({
      let: {
        r: { component: { type: 'Resource', subtype: 'AWS::IAM::Policy' } },
        change: { change: { type: 'INSERT' } },
      },
      where: [ 'change appliesTo r.Properties.PolicyDocument.Statement.*.Effect' ],
      effect: { risk: 'high' },
    });
  });

  test('errors when a condition references an id that is not in binding', () => {
    // WHEN
    const error = () => new Rule([change], { conditions: [change.appliesTo(component)] });

    // THEN
    expect(error).toThrowError(`Conditions must refer to identifiers defined in rule bindings, received: ${component.id}`);
  });
});