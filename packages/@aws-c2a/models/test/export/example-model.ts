import {
  Component,
  ComponentPropertyPrimitive,
  ComponentPropertyRecord,
  ComponentUpdateType,
  DependencyRelationship,
  InfraModel,
} from '../../infra-model';
import { InfraModelDiff, Transition, UpdatePropertyComponentOperation } from '../../model-diffing';


export const buildModelV1 = (): InfraModel => {
  const component1v1 = new Component('component1', 'resource', {
    subtype: 'AWS::IAM::Role',
    properties: new ComponentPropertyRecord(
      {
        someKey: new ComponentPropertyPrimitive('someValue', ComponentUpdateType.REPLACEMENT),
      }, ComponentUpdateType.REPLACEMENT,
    ),
  });
  const component2v1 = new Component('component2', 'resource', {
    subtype: 'AWS::EC2::Instance',
    properties: new ComponentPropertyRecord({
      nested: new ComponentPropertyRecord({
        propComp2: new ComponentPropertyPrimitive('value', ComponentUpdateType.REPLACEMENT),
      }, ComponentUpdateType.REPLACEMENT),
    }, ComponentUpdateType.REPLACEMENT,
    ),
  });
  const relationship1v1 = new DependencyRelationship(component2v1, component1v1, 'relationship1', {sourcePropertyPath: ['nested', 'propComp2']});
  component1v1.addIncoming(relationship1v1);
  component2v1.addOutgoing(relationship1v1);
  const infraModelv1 = new InfraModel([component1v1, component2v1], [relationship1v1]);

  return infraModelv1;
};

const buildModelV2 = (): InfraModel => {
  const component1v2 = new Component('component1', 'resource', {
    subtype: 'AWS::IAM::Role',
    properties: new ComponentPropertyRecord(
      {
        someKey: new ComponentPropertyPrimitive('someValueChanged', ComponentUpdateType.REPLACEMENT),
      }, ComponentUpdateType.REPLACEMENT,
    ),
  });
  const component2v2 = new Component('component2', 'resource', {
    subtype: 'AWS::EC2::Instance',
    properties: new ComponentPropertyRecord({
      nestedNameChanged: new ComponentPropertyRecord({
        propComp2NameChanged: new ComponentPropertyPrimitive('value', ComponentUpdateType.REPLACEMENT),
      }, ComponentUpdateType.REPLACEMENT),
    }, ComponentUpdateType.REPLACEMENT,
    ),
  });
  const relationship1v2 = new DependencyRelationship(component2v2, component1v2, 'relationship1', {sourcePropertyPath: ['nestedNameChanged', 'propComp2NameChanged']});
  component1v2.addIncoming(relationship1v2);
  component2v2.addOutgoing(relationship1v2);
  const infraModelv2 = new InfraModel([component1v2, component2v2], [relationship1v2]);

  return infraModelv2;
};

export const buildDiff = (): InfraModelDiff => {

  const infraModelv1 = buildModelV1();
  const infraModelv2 = buildModelV2();

  const component1v1 = infraModelv1.components[0];
  const component1v2 = infraModelv2.components[0];
  const component2v1 = infraModelv1.components[1];
  const component2v2 = infraModelv2.components[1];

  const component1Transition = new Transition<Component>({v1: component1v1, v2: component1v2});
  const component2Transition = new Transition<Component>({v1: component2v1, v2: component2v2});

  const directChangeComponent1 = new UpdatePropertyComponentOperation({}, {
    pathTransition: new Transition({v1: ['someKey'], v2: ['someKey']}),
    propertyTransition: new Transition({
      v1: component1v1.properties.getRecord().someKey,
      v2: component1v2.properties.getRecord().someKey,
    }),
    componentTransition: component1Transition,
  });

  const directChangeComponent2 = new UpdatePropertyComponentOperation({}, {
    pathTransition: new Transition({v1: ['nested', 'propComp2'], v2: ['nestedNameChanged', 'propComp2NameChanged']}),
    propertyTransition: new Transition({
      v1: component2v1.properties.getRecord().nested.getRecord().propComp2,
      v2: component2v2.properties.getRecord().nestedNameChanged.getRecord().propComp2NameChanged,
    }),
    componentTransition: component2Transition,
  });

  const infraModelTransition =  new Transition<InfraModel>({v1: infraModelv1, v2: infraModelv2});

  return new InfraModelDiff(
    [directChangeComponent1, directChangeComponent2],
    [component1Transition, component2Transition], infraModelTransition,
  );
};