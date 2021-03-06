import {
  UpdatePropertyComponentOperation,
  InfraModelDiff,
  Transition,
  Component,
  ComponentPropertyPrimitive,
  ComponentPropertyRecord,
  ComponentUpdateType,
  DependencyRelationship,
  StructuralRelationship,
  InfraModel,
} from '@aws-c2a/models';

export function diffTestCase1(): InfraModelDiff {
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
  const component3v1 = new Component('component3', 'construct');
  const relationship2v1 = new StructuralRelationship(component3v1, component1v1, 'parent');
  component1v1.addIncoming(relationship2v1);
  component3v1.addOutgoing(relationship2v1);

  const infraModelv1 = new InfraModel([component1v1, component2v1], [relationship1v1, relationship2v1]);

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
  const component3v2 = new Component('component3', 'construct');
  const relationship2v2 = new StructuralRelationship(component3v2, component1v2, 'parent');
  component1v2.addIncoming(relationship2v2);
  component3v2.addOutgoing(relationship2v2);

  const infraModelv2 = new InfraModel([component1v2, component2v2], [relationship1v2, relationship2v2]);

  const component1Transition = new Transition<Component>({v1: component1v1, v2: component1v2});
  const component2Transition = new Transition<Component>({v1: component2v1, v2: component2v2});

  const directChangeComponent1 = new UpdatePropertyComponentOperation(
    {},
    {
      pathTransition: new Transition({v1: ['someKey'], v2: ['someKey']}),
      propertyTransition: new Transition({
        v1: component1v1.properties.getRecord().someKey,
        v2: component1v2.properties.getRecord().someKey,
      }),
      componentTransition: component1Transition,
    },
  );

  const directChangeComponent2 = new UpdatePropertyComponentOperation(
    {},
    {
      pathTransition: new Transition({v1: ['nested', 'propComp2'], v2: ['nestedNameChanged', 'propComp2NameChanged']}),
      propertyTransition: new Transition({
        v1: component2v1.properties.getRecord().nested.getRecord().propComp2,
        v2: component2v2.properties.getRecord().nestedNameChanged.getRecord().propComp2NameChanged,
      }),
      componentTransition: component2Transition,
    },
  );

  const infraModelTransition = new Transition<InfraModel>({v1: infraModelv1, v2: infraModelv2});

  return new InfraModelDiff(
    [directChangeComponent1, directChangeComponent2],
    [component1Transition, component2Transition],
    infraModelTransition,
  );
}