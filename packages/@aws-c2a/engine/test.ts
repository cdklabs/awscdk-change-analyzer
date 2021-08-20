
import * as fs from 'fs';
import { Transition, JSONSerializer } from '@aws-c2a/models';
import { CDKParser, createChangeAnalysisReport } from './lib';

const before = {
  Resources: {
    Lambda: {
      Type: 'AWS::Lambda::Function',
    },
    Policy: {
      Type: 'AWS::IAM::Policy',
      Properties: {
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Deny',
              Action: 'lambda:*',
              Resource: '*',
            },
          ],
        },
      },
    },
  },
};

const after = {
  Resources: {
    Lambda: {
      Type: 'AWS::Lambda::Function',
    },
    Policy: {
      Type: 'AWS::IAM::Policy',
      Properties: {
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: 'lambda:*',
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: 'lambda:*',
              Resource: '*',
            },
          ],
        },
      },
    },
  },
};

const rules: any = [{
  let: { policy: { Resource: 'AWS::IAM::Policy' } },
  then: [
    {
      let: {
        propertyInsertChange: { change: { propertyOperationType: 'INSERT' }, where: 'propertyInsertChange appliesTo policy' },
        statementChange: { change: { propertyOperationType: 'UPDATE' }, where: [ 'statementChange appliesTo policy.Properties.PolicyDocument.Statement' ] },
        change: { change: { propertyOperationType: 'UPDATE' }, where: [ ] },
        where: [ 'propertyInsertChange == statementChange' ],
      },
      effect: { risk: 'high' },
    },
    {
      let: {
        change: { change: { propertyOperationType: 'UPDATE' }, where: [ 'change appliesTo policy.Properties.PolicyDocument.Statement' ] },
      },
      effect: { risk: 'high' },
    },
    // {
    //   let: { change: { change: {} } },
    //   where: [ 'change appliesTo policy.Properties.PolicyDocument.Statement.*.Effect', 'change.new == "Allow"' ],
    //   effect: { risk: 'high' }
    // }
  ],
}];

const oldModel = new CDKParser('root', before).parse();
const newModel = new CDKParser('root', after).parse();

const report = createChangeAnalysisReport(new Transition({ v1: oldModel, v2: newModel}), rules);

fs.writeFileSync('report.json', new JSONSerializer().serialize(report));
