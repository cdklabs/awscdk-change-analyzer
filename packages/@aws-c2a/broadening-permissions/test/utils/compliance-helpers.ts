import { InfraModel, OperationType } from '@aws-c2a/models';
import * as fn from 'fifinet';
import { CFParser } from '@aws-c2a/engine';
import { SecurityChangesRules } from '../../lib';
import { processRules, firstKey } from '../utils';

const DEFAULT_RULES = SecurityChangesRules.BroadeningPermissions().rules;
type property = { value: string };

interface ProcessOutput {
  graph: fn.Graph<any, {_label: string, _in: string, _out: string}>;
  firstVertex: string;
}

export function process(after: any, before: InfraModel): ProcessOutput {
  // WHEN
  const newModel = new CFParser('root', after).parse();
  const { graph, rulesOutput: result } = processRules(before, newModel, DEFAULT_RULES);
  const firstVertex = firstKey(result)._id;
  return { graph, firstVertex };
}

export function THEN_expectResource(after: any, before: InfraModel, type: OperationType, properties: property[]): void {
  // WHEN
  const {graph: g, firstVertex} = process(after, before);

  // THEN
  expect(g.v(firstVertex).run()).toHaveLength(1);
  expect(g.v(firstVertex).run()[0]).toMatchObject({ type });
  const component = g.v(firstVertex).out('appliesTo').filter({entityType: 'component'});
  const vertices = component.outAny().filter({entityType: 'property'}).run();
  properties.forEach(property => expect(vertices).toContainObject(property));
}

export function THEN_expectNoResults(after: any, before: InfraModel): void {
  // WHEN
  const newModel = new CFParser('root', after).parse();
  const { rulesOutput: result } = processRules(before, newModel, DEFAULT_RULES);

  // THEN
  expect(result.size).toBe(0);
}

export function THEN_expectProperty(after: any, before: InfraModel, type: OperationType, properties: property[]): void {
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