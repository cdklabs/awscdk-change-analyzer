import {
  ComponentUpdateType,
  DependencyRelationship,
} from 'cdk-change-analyzer-models';
import { CFParser } from '../../../lib/platform-mapping';

test('Update type on first level resource property', () => {

  const parser = new CFParser('root', {
    Parameters: {
      Parameter0: {
        Type: 'String',
        Default: 'defaultValue',
      },
    },
    Resources: {
      EC2: {
        Type: 'AWS::EC2::Instance',
        Properties: {
          NetworkInterfaces: [{ // Immutable
            Description: { Ref: 'Parameter0' }, // Mutable
          }],
        },
      },
    },
  });

  const model = parser.parse();
  expect(model.components.length).toBe(3);
  expect(model.relationships.length).toBe(3);
  expect(model.relationships.filter(r => r instanceof DependencyRelationship).length).toBe(1);
  const ec2InstanceProperties = model.components.find(r =>
    r.subtype === 'AWS::EC2::Instance')?.properties.getRecord().Properties.getRecord();
  expect(ec2InstanceProperties?.NetworkInterfaces.componentUpdateType)
    .toBe(ComponentUpdateType.REPLACEMENT);
  expect(ec2InstanceProperties?.NetworkInterfaces.getArray()[0].componentUpdateType)
    .toBe(ComponentUpdateType.NONE);
  expect(ec2InstanceProperties?.NetworkInterfaces.getArray()[0].getRecord().Description.componentUpdateType)
    .toBe(ComponentUpdateType.NONE);
});

test('Update type on second level resource property', () => {

  const parser = new CFParser('root', {
    Parameters: {
      Parameter0: {
        Type: 'String',
        Default: 'defaultValue',
      },
    },
    Resources: {
      EC2: {
        Type: 'AWS::EC2::Instance',
        Properties: {
          BlockDeviceMappings: [{ // Conditional
            DeviceName: { Ref: 'Parameter0' }, // Mutable
          }],
        },
      },
    },
  });

  const model = parser.parse();
  expect(model.components.length).toBe(3);
  expect(model.relationships.length).toBe(3);
  expect(model.relationships.filter(r => r instanceof DependencyRelationship).length).toBe(1);
  const ec2InstanceProperties = model.components.find(r =>r.subtype === 'AWS::EC2::Instance')?.properties.getRecord().Properties.getRecord();
  expect(ec2InstanceProperties?.BlockDeviceMappings.componentUpdateType)
    .toBe(ComponentUpdateType.POSSIBLE_REPLACEMENT);
  expect(ec2InstanceProperties?.BlockDeviceMappings.getArray()[0].componentUpdateType)
    .toBe(ComponentUpdateType.NONE);
  expect(ec2InstanceProperties?.BlockDeviceMappings.getArray()[0].getRecord().DeviceName.componentUpdateType)
    .toBe(ComponentUpdateType.NONE);
});

test('Unknown type on second level resource property', () => {

  const parser = new CFParser('root', {
    Parameters: {
      Parameter0: {
        Type: 'String',
        Default: 'defaultValue',
      },
    },
    Resources: {
      EC2: {
        Type: 'AWS::EC2::Instance',
        Properties: {
          SomeUnknownProperty: [{
            AnotherUnknownProperty: { Ref: 'Parameter0' },
          }],
        },
      },
    },
  });

  const model = parser.parse();
  expect(model.components.length).toBe(3);
  expect(model.relationships.length).toBe(3);
  expect(model.relationships.filter(r => r instanceof DependencyRelationship).length).toBe(1);
  const ec2InstanceProperties = model.components.find(r =>r.subtype === 'AWS::EC2::Instance')?.properties.getRecord().Properties.getRecord();
  const unknownProperty = ec2InstanceProperties?.SomeUnknownProperty;
  expect(unknownProperty?.componentUpdateType)
    .toBe(ComponentUpdateType.NONE);
  expect(unknownProperty?.getArray()[0].componentUpdateType)
    .toBe(ComponentUpdateType.NONE);
  expect(unknownProperty?.getArray()[0].getRecord().AnotherUnknownProperty.componentUpdateType)
    .toBe(ComponentUpdateType.NONE);
});