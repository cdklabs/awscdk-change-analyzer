import { DependencyRelationship, StructuralRelationship } from 'cdk-change-analyzer-models';
import { CDKParser } from '../../../platform-mapping';
import { ParserUtilsCreator } from '../../utils';

const cdkParserDir = 'test/platform-mapping/cdk';

const {
  readSampleInput,
  genGraphOnEnvFlag,
  stringifyComponents,
} = ParserUtilsCreator(cdkParserDir);

test('CDK simple template', () => {
  const cfnTemplate = readSampleInput('simple-template.json');
  const parser = new CDKParser(cfnTemplate);
  const model = parser.parse();

  genGraphOnEnvFlag(model, 'simple-template');

  expect(stringifyComponents(model)).toMatchSnapshot();
});

test('CDK kessel run stack template', () => {
  const cfnTemplate = readSampleInput('KesselRunStack.template.json');
  const parser = new CDKParser(cfnTemplate);
  const model = parser.parse();

  genGraphOnEnvFlag(model, 'kessel-run-template');

  expect(stringifyComponents(model)).toMatchSnapshot();
});

test('Basic resources', () => {
  const parser = new CDKParser({
    Resources: {
      logicalId0: {
        Type: 'AWS::IAM::Policy',
        Properties: {
          property1: 'propertyValue',
          property2: { Ref: 'logicalId1' },
        },
        Metadata: {
          'aws:cdk:path': 'CDKStack/OutterConstruct0/InnerConstruct/Resource',
        },
      },
      logicalId1: {
        Type: 'AWS::IAM::Policy',
        Metadata: {
          'aws:cdk:path': 'CDKStack/OutterConstruct1/InnerConstruct/Resource',
        },
      },
    },
  });
  const model = parser.parse();
  genGraphOnEnvFlag(model, 'basic-resources-template');
  expect(model.components.length).toBe(9);
  expect(model.relationships.length).toBe(9);
  expect(model.relationships.filter(r => r instanceof DependencyRelationship).length).toBe(1);
  expect(model.components.filter(c => c.name == 'InnerConstruct').length).toBe(2);
  expect(model.components.filter(c => c.name == 'InnerConstruct').length).toBe(2);
  expect(model.relationships.filter(r =>
    r.source.name == 'CDKStack'
        && r.target.name == 'OutterConstruct1'
        && r instanceof StructuralRelationship,
  ).length).toBe(1);
  expect(model.relationships.filter(r =>
    r.source.name == 'CDKStack'
        && r instanceof StructuralRelationship,
  ).length).toBe(2);
  expect(model.relationships.filter(r =>
    r.source.name == 'OutterConstruct1'
        && r.target.name == 'InnerConstruct'
        && r instanceof StructuralRelationship,
  ).length).toBe(1);
});