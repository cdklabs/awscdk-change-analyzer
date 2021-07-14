import {
  DependencyRelationship,
  StructuralRelationship,
} from 'cdk-change-analyzer-models';
import { CFParser } from '../../../platform-mapping';
import { ParserUtilsCreator } from '../../utils';

const cloudformationDir = 'test/platform-mapping/cloudformation';

const {
  genGraphOnEnvFlag,
} = ParserUtilsCreator(cloudformationDir);

test('Nested Stack Parameters\' dependencies', () => {
  const outer = {
    Parameters: {
      Parameter0: {
        Type: 'String',
        Default: 'defaultValue',
      },
    },
    Resources: {
      NestedStack: {
        Type: 'AWS::CloudFormation::Stack',
        Properties: {
          Parameters: {
            InnerParameter0: { Ref: 'Parameter0'},
          },
        },
      },
    },
  };

  const inner = {
    Parameters: {
      InnerParameter0: {
        Type: 'String',
        Default: 'defaultValue',
      },
    },
  };

  const parser = new CFParser(outer);
  const model = parser.parse({nestedStacks: {NestedStack: inner}});
  expect(model.components.length).toBe(4);
  expect(model.relationships.length).toBe(5);
  expect(model.relationships.filter(r => r instanceof DependencyRelationship).length).toBe(2);
  expect(model.relationships.filter(dr =>
    dr instanceof DependencyRelationship
      && dr.source.name === 'InnerParameter0'
      && dr.target.name === 'Parameter0'
      && [...dr.source.incoming].filter(sr =>
        sr instanceof StructuralRelationship && sr.source.name === 'NestedStack',
      ).length === 1,
  ).length).toBe(1);
});

test('Nested Stack Outputs\' dependencies', () => {
  const outer = {
    Resources: {
      NestedStack: {
        Type: 'AWS::CloudFormation::Stack',
        Properties: {},
      },
      Resource: {
        Type: 'AWS::IAM::Role',
        Properties: {
          Property: { 'Fn::GetAtt': ['NestedStack', 'Outputs.Output'] },
        },
      },
    },
  };

  const inner = {
    Outputs: {
      Output: {
        Value: 'value',
      },
    },
  };

  const parser = new CFParser(outer);
  const model = parser.parse({nestedStacks: {NestedStack: inner}});
  expect(model.components.length).toBe(4);
  expect(model.relationships.length).toBe(5);
  expect(model.relationships.filter(r => r instanceof DependencyRelationship).length).toBe(2);
  expect(model.relationships.filter(r =>
    r instanceof DependencyRelationship
        && r.source.name === 'Resource'
        && r.target.name === 'Output',
  ).length).toBe(1);
});

test('Double Nested Stack\'s dependencies', () => {
  const outerStack = {
    Parameters: {
      Parameter: {
        Type: 'String',
        Default: 'defaultValue',
      },
    },
    Resources: {
      MiddleStack: {
        Type: 'AWS::CloudFormation::Stack',
        Properties: {
          Parameters: {
            MiddleParameter: { Ref: 'Parameter'},
          },
        },
      },
      Resource: {
        Type: 'AWS::IAM::Role',
        Properties: {
          Property: { 'Fn::GetAtt': ['MiddleStack', 'Outputs.MiddleOutput'] },
        },
      },
    },
  };

  const middleStack = {
    Parameters: {
      MiddleParameter: {
        Type: 'String',
        Default: 'defaultValue',
      },
    },
    Resources: {
      InnerStack: {
        Type: 'AWS::CloudFormation::Stack',
        Properties: {
          Parameters: {
            InnerParameter: { Ref: 'MiddleParameter'},
          },
        },
      },
    },
    Outputs: {
      MiddleOutput: {
        Value: { 'Fn::GetAtt': ['InnerStack', 'Outputs.InnerOutput'] },
      },
    },
  };

  const innerStack = {
    Parameters: {
      InnerParameter: {
        Type: 'String',
        Default: 'defaultValue',
      },
    },
    Outputs: {
      InnerOutput: {
        Value: 'value',
      },
    },
  };

  const parser = new CFParser(outerStack);
  const model = parser.parse({nestedStacks: {MiddleStack: middleStack, InnerStack: innerStack}});
  genGraphOnEnvFlag(model, 'double-nested-stack');
  expect(model.components.length).toBe(9);
  expect(model.relationships.length).toBe(19);
  expect(model.relationships.filter(r => r instanceof DependencyRelationship).length).toBe(11);
  expect(model.relationships.filter(dr =>
    dr instanceof DependencyRelationship
         && dr.source.name === 'MiddleParameter'
         && dr.target.name === 'Parameter'
         && [...dr.source.incoming].filter(sr => sr instanceof StructuralRelationship && sr.source.name === 'MiddleStack').length === 1,
  ).length).toBe(1);
  expect(model.relationships.filter(dr =>
    dr instanceof DependencyRelationship
        && dr.source.name === 'InnerParameter'
        && dr.target.name === 'MiddleParameter'
        && [...dr.source.incoming].filter(sr => sr instanceof StructuralRelationship && sr.source.name === 'InnerStack').length === 1,
  ).length).toBe(1);
  expect(model.relationships.filter(r =>
    r instanceof DependencyRelationship
            && r.source.name === 'Resource'
            && r.target.name === 'MiddleOutput',
  ).length).toBe(1);
  expect(model.relationships.filter(r =>
    r instanceof DependencyRelationship
            && r.source.name === 'MiddleOutput'
            && r.target.name === 'InnerOutput',
  ).length).toBe(1);
});