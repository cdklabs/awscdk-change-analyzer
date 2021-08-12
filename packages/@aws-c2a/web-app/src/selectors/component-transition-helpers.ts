import { JSONSerializable, Serialized } from '@aws-c2a/models/export/json-serializable';
import { Component, InfraModel, StructuralRelationship } from '@aws-c2a/models/infra-model';
import { Transition } from '@aws-c2a/models/model-diffing';

export function mostRecentInTransition<T extends JSONSerializable | Serialized>(t: Transition<T>): T{
  const mostRecent = t.v2 ?? t.v1;

  if(mostRecent === undefined) throw Error('Found empty transition');

  return mostRecent;
}

export function getComponentStructuralPath(component: Component): string {
  const parentRelationship = [...component.incoming].find(r => r instanceof StructuralRelationship);
  if(!parentRelationship) return component.name;
  const parent = parentRelationship.source;
  return `${getComponentStructuralPath(parent)} / ${component.name}`;
}