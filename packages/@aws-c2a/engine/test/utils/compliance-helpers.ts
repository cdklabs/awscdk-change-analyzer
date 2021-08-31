import { InfraModel, OperationType } from '@aws-c2a/models';
import { CFParser } from '../../lib/platform-mapping';
import { SecurityChangesRules } from '../../lib/rules';
import { processRules, firstKey } from '../utils';

const DEFAULT_RULES = SecurityChangesRules.BroadeningPermissions().rules;

export function process(after: any, before: InfraModel) {
  // WHEN
  const newModel = new CFParser('root', after).parse();
  const { graph, rulesOutput: result } = processRules(before, newModel, DEFAULT_RULES);
  const firstVertex = firstKey(result)._id;
  return { graph, firstVertex };
}

export function THEN_expectResource(after: any, before: InfraModel, type: OperationType, properties: property[]) {
  // WHEN
  const {graph: g, firstVertex} = process(after, before);

  // THEN
  expect(g.v(firstVertex).run()).toHaveLength(1);
  expect(g.v(firstVertex).run()[0]).toMatchObject({ type });
  const component = g.v(firstVertex).out('appliesTo').filter({entityType: 'component'});
  const vertices = component.outAny().filter({entityType: 'property'}).run()
  properties.forEach(property => expect(vertices).toContainObject(property));
}

export function THEN_expectNoResults(after: any, before: InfraModel) {
  // WHEN
  const newModel = new CFParser('root', after).parse();
  const { rulesOutput: result } = processRules(before, newModel, DEFAULT_RULES);

  // THEN
  expect(result.size).toBe(0);
}


type property = { value: string; };
export function THEN_expectProperty(after: any, before: InfraModel, type: OperationType, properties: property[]) {
  const {graph: g, firstVertex} = process(after, before);

  // THEN
  expect(g.v(firstVertex).run()).toHaveLength(1);
  expect(g.v(firstVertex).run()[0]).toMatchObject({ propertyOperationType: type });
  const propertyVertices = g.v(firstVertex).out('appliesTo').filter({entityType: 'property'});
  // Checking for two properties indicates an update between two records
  // Therefore we take the out going edges of those two records
  const vertices = (properties.length > 1 ? propertyVertices.outAny(): propertyVertices).run();
  properties.forEach(property => expect(vertices).toContainObject(property));
}