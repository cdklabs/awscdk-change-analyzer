import { isScopeVertex, OperatorHandler, ScopeNode } from "../rule-processor";
import * as fn from 'fifinet';

/**
 * Ensures vertex t1 has edge appliesTo to t2 in graph g
 * @param g the Graph
 * @param t1 vertex 1
 * @param t2 vertex 2
 */
export const appliesToHandler: OperatorHandler = <V, E>(
    g: fn.Graph<V,E>,
    t1: ScopeNode,
    t2: ScopeNode
): boolean => {
    if(!isScopeVertex(t1) || !isScopeVertex(t2)) return false;

    return g
        .v(t2.vertex._id)
        .inAny("appliesTo")
        .run()
        .filter(v => v._id === t1.vertex._id)
        .length > 0;
};