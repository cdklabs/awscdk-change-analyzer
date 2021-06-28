import { diffTestCase1 } from "../default-test-cases/infra-model-diff";
import { CUserRule, parseRules, RuleProcessor, UserRule } from "../../user-configuration";
import { RuleAction, RuleRisk } from "change-cd-iac-models/rules";
import { RuleConditionOperator } from "../../user-configuration";
import { CUserRules, UserRules } from "../../user-configuration";

const diffTestCase1CRules: CUserRule[] = [{
    let: {
        role: { component: { 'type': 'resource', 'subtype': 'AWS::IAM::Role' }},
        instance: { resource: 'AWS::EC2::Instance'},
    },
    then: [{
        let: {
            someKey: 'role.someKey',
            nested: 'instance.nested',
            propComp2_1: 'instance.nested.propComp2',
            propComp2_2: 'nested.propComp2',
            change: { change: {type: 'UPDATE' } }
        },
        effect: {
            target: 'change',
            risk: RuleRisk.High,
            action: RuleAction.Reject
        }
    }],
}];

const diffTestCase1Rules: UserRule[] = [{
    let: {
        role: { filter: { _entityType: 'component', type: 'resource', subtype: 'AWS::IAM::Role' }},
        instance: { filter: { _entityType: 'component', type: 'resource', subtype: 'AWS::EC2::Instance' }},
    },
    then: [{
        let: {
            someKey: { propertyReference: {identifier: 'role', propertyPath: ['someKey'] } },
            nested: { propertyReference: {identifier: 'instance', propertyPath: ['nested'] } },
            propComp2_1: { propertyReference: {identifier: 'instance', propertyPath: ['nested', 'propComp2'] } },
            propComp2_2: { propertyReference: {identifier: 'nested', propertyPath: ['propComp2'] } },
            change: { filter: {_entityType: 'change', type: 'UPDATE' } }
        },
        effect: {
            target: 'change',
            risk: RuleRisk.High,
            action: RuleAction.Reject
        }
    }],
}];

test('Rules parser', () => {
    expect(parseRules(diffTestCase1CRules)).toEqual(diffTestCase1Rules);
});

test('Rules conditions parsing', () => {
    const cRules: CUserRules = [{
        let: {
            role: { resource: 'AWS::IAM::Role' },
            change: { change: {}, ...{where: ['change appliesTo role']}}
        }
    }];

    const expectedRules: UserRules = [{
        let: {
            role: { filter: { _entityType: 'component', type: 'resource', subtype: 'AWS::IAM::Role' }},
            change: {
                filter: {_entityType: 'change'},
                where: [{
                    operator: RuleConditionOperator.appliesTo,
                    leftInput: {identifier: 'change'},
                    rightInput: {identifier: 'role'}
                }]
            }
        }
    }];

    expect(parseRules(cRules)).toMatchObject(expectedRules);
});

test('Rule processor basic filter', () => {
    
    const diff = diffTestCase1();

    const result = new RuleProcessor(diff.generateOutgoingGraph()).processRules(diffTestCase1Rules);

    expect(result.size).toEqual(2);
    expect([...result][0][0]).toMatchObject({ _entityType: 'change', type: 'UPDATE' });
    expect([...result][0][1]).toEqual({risk: RuleRisk.High, action: RuleAction.Reject});
    expect([...result][1][0]).toMatchObject({ _entityType: 'change', type: 'UPDATE' });
    expect([...result][1][1]).toEqual({risk: RuleRisk.High, action: RuleAction.Reject});
});

test('Rule processor appliesTo condition', () => {
    
    const diff = diffTestCase1();

    const rules = [{
        let: {
            role: { filter: { _entityType: 'component', type: 'resource', subtype: 'AWS::IAM::Role' }},
            change: { filter: {_entityType: 'change' }, where: [{
                leftInput: {identifier: 'change'},
                operator: RuleConditionOperator.appliesTo,
                rightInput: {identifier: 'role'}
            }] }
        },
        effect: {
            target: 'change',
            risk: RuleRisk.High,
            action: RuleAction.Reject
        }
    }]; 

    const result = new RuleProcessor(diff.generateOutgoingGraph()).processRules(rules);
    expect(result.size).toEqual(1);
    expect([...result][0][0]).toMatchObject({ _entityType: 'change', type: 'UPDATE' });
    expect([...result][0][1]).toEqual({risk: RuleRisk.High, action: RuleAction.Reject});
});