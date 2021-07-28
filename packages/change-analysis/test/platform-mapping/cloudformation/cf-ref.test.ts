import { CFRef } from '../../../lib/platform-mapping/cloudformation';

test('Read ref in expression', () => {
  const refs: CFRef[] = CFRef.readRefsInExpression({
    Ref: 'ref-value-1',
  });

  expect(refs.length).toBe(1);
  expect(refs[0].logicalId).toEqual('ref-value-1');
  expect(refs[0].sourcePath).toEqual(['Ref']);
});

test('Read deep ref in expression', () => {
  const refs: CFRef[] = CFRef.readRefsInExpression({
    key0: { Ref: 'logicalId0'},
    key1: {
      key2: {Ref: 'logicalId1'},
    },
  });

  expect(refs.length).toBe(2);
  expect(refs[0].logicalId).toEqual('logicalId0');
  expect(refs[0].sourcePath).toEqual(['key0', 'Ref']);
  expect(refs[0].destPath.length).toBe(0);
  expect(refs[1].logicalId).toEqual('logicalId1');
  expect(refs[1].sourcePath).toEqual(['key1', 'key2', 'Ref']);
  expect(refs[1].destPath.length).toBe(0);
});


test('Read ref with attributes in expression', () => {
  const refs: CFRef[] = CFRef.readRefsInExpression(
    { Ref: 'logicalId0.attribute0.attribute1.attribute2'},
  );

  expect(refs.length).toBe(1);
  expect(refs[0].destPath).toEqual(['attribute0','attribute1','attribute2']);
});


test('Read GetAtt in expression', () => {
  const refs: CFRef[] = CFRef.readRefsInExpression({
    key0: {
      'Fn::GetAtt': ['logicalId0', 'attribute0.attribute1.attribute2'],
    },
  });

  expect(refs.length).toBe(1);
  expect(refs[0].logicalId).toEqual('logicalId0');
  expect(refs[0].sourcePath).toEqual(['key0', 'Fn::GetAtt']);
  expect(refs[0].destPath).toEqual(['attribute0','attribute1','attribute2']);
});

test('Invalid Fn::GetAtt in expression', () => {
  const refs: CFRef[] = CFRef.readRefsInExpression({
    'Fn::GetAtt': ['logicalId0'],
  });

  expect(refs.length).toBe(0);
});

test('Read Fn::Sub in expression', () => {
  const refs: CFRef[] = CFRef.readRefsInExpression({
    key0: {
      'Fn::Sub': [
        'placeholder\
                ${logicalId0}placeholder\
                ${AWS::Region}\
                ${parameter}\
                ${logicalId1.attribute0.attribute1}',
        {parameter: 'parameterValue'},
      ],
    },
  });

  expect(refs.length).toBe(2);
  expect(refs[0].logicalId).toEqual('logicalId0');
  expect(refs[0].sourcePath).toEqual(['key0', 'Fn::Sub']);
  expect(refs[0].destPath).toEqual([]);
  expect(refs[1].logicalId).toEqual('logicalId1');
  expect(refs[1].sourcePath).toEqual(['key0', 'Fn::Sub']);
  expect(refs[1].destPath).toEqual(['attribute0','attribute1']);
});

test('Invalid Fn::Sub in expression', () => {
  const refs: CFRef[] = CFRef.readRefsInExpression({
    'Fn::Sub': ['${invalid-id}', {'invalid-id': 'value'}],
  });

  expect(refs.length).toBe(0);
});

