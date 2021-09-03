import { ModelEntityTypes, RelationshipType } from '@aws-c2a/models';
import * as fn from 'fifinet';
import { isScopeVertex, OperatorHandler, ScopeNode } from '../rule-processor';

/**
 * Ensures vertex t1 has edge 'source' to intermediary structural relationship vertex with, which has edge 'target' to t2 in graph g
 * @param g the Graph
 * @param t1 vertex 1
 * @param t2 vertex 2
 */
export const containsHandler: OperatorHandler = <V, E>(
  g: fn.Graph<V,E>,
  t1: ScopeNode,
  t2: ScopeNode,
): boolean => {
  if(!isScopeVertex(t1) || !isScopeVertex(t2)) return false;

  return g
    .v(t1.vertex._id)
    .inAny('source')
    .filter({
      entityType: ModelEntityTypes.relationship,
      relationshipType: RelationshipType.Structural,
    } as unknown as fn.VertexProps<V>)
    .outAny('target')
    .run()
    .filter(v => v._id === t2.vertex._id)
    .length > 0;
};

/**
 * Ensures vertex t2 has edge 'source' to intermediary structural relationship vertex, which has edge 'target' to t1 in graph g
 * @param g the Graph
 * @param t1 vertex 1
 * @param t2 vertex 2
 */
export const isContainedInHandler: OperatorHandler = <V, E>(
  g: fn.Graph<V,E>,
  t1: ScopeNode,
  t2: ScopeNode,
): boolean => {
  return containsHandler(g, t2, t1);
};