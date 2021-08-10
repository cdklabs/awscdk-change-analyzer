import {
  DependencyRelationship,
} from '@aws-c2a/models';
import { CFParser } from '../../../lib/platform-mapping';
import { ParserUtilsCreator } from '../../utils';

const cloudformationDir = 'test/platform-mapping/cloudformation';

const {
  readSampleInput,
  genGraphOnEnvFlag,
  stringifyComponents,
} = ParserUtilsCreator(cloudformationDir);

test('CloudFormation simple template', () => {
  const cfnTemplate = readSampleInput('integ.dynamodb.expected.json');
  const parser = new CFParser('root', cfnTemplate);
  const model = parser.parse();

  genGraphOnEnvFlag(model, 'integ.dynamodb.expected');

  expect(stringifyComponents(model)).toMatchSnapshot();
  expect(model.components.length).toBe(7);
  expect(model.relationships.length).toBe(10);
  expect(model.relationships.filter(r => r instanceof DependencyRelationship).length).toBe(4);
});

test('CloudFormation complex template', () => {
  const cfnTemplate = readSampleInput('integ.instance.expected.json');
  const parser = new CFParser('root', cfnTemplate);
  const model = parser.parse();

  genGraphOnEnvFlag(model, 'integ.instance.expected');

  expect(stringifyComponents(model)).toMatchSnapshot();
  expect(model.components.length).toBe(40);
  expect(model.relationships.length).toBe(95);
  expect(model.relationships.filter(r => r instanceof DependencyRelationship).length).toBe(56);
});

test('CloudFormation nested template', () => {
  const cfnTemplateOuter = readSampleInput('nested-stacks-outer.json');
  const cfnTemplateInner = readSampleInput('nested-stacks-inner.json');

  const parser = new CFParser('root', cfnTemplateOuter);
  const model = parser.parse({nestedStacks: {NestedStack: cfnTemplateInner}});

  genGraphOnEnvFlag(model, 'nested-stacks');

  expect(stringifyComponents(model)).toMatchSnapshot();
  expect(model.components.length).toBe(8);
  expect(model.relationships.length).toBe(16);
  expect(model.relationships.filter(r => r instanceof DependencyRelationship).length).toBe(9);
});

test('Basic resources', () => {
  const parser = new CFParser('root', {
    Resources: {
      logicalId0: {
        Type: 'AWS::IAM::Policy',
        Properties: {
          property1: 'propertyValue',
          property2: { Ref: 'logicalId1' },
        },
      },
      logicalId1: {
        Type: 'AWS::IAM::Policy',
      },
    },
  });
  const model = parser.parse();
  expect(model.components.length).toBe(3);
  expect(model.relationships.length).toBe(3);
  expect(model.relationships.filter(r => r instanceof DependencyRelationship).length).toBe(1);
});
