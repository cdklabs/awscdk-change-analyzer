import * as fn from 'fifinet';
import { isScopeVertex, OperatorHandler, ScopeNode } from '../rule-processor';

/**
 * Ensures t1 equals to t2
 * @param g the Graph
 * @param t1 vertex 1
 * @param t2 vertex 2
 */
export const equalsHandler: OperatorHandler = <V, E>(
  g: fn.Graph<V,E>,
  t1: ScopeNode,
  t2: ScopeNode,
): boolean => {

  const extractValueFromVertex = (v: fn.Vertex<V, E>) => {
    if({}.hasOwnProperty.call(v, 'value')){
      return (v as fn.Vertex<V, E> & {value: any}).value;
    }
  };

  // If the specified scalar value is '*' and not the property
  // of a vertex, we treat the value as a wildcard.
  if (!isScopeVertex(t1) && t1.value === '*') return true;
  if (!isScopeVertex(t2) && t2.value === '*') return true;

  const [val1, val2] = [t1, t2].map(t => {
    if(isScopeVertex(t)){
      return extractValueFromVertex(t.vertex);
    } else {
      return t.value;
    }
  });

  return val1 === val2;
};