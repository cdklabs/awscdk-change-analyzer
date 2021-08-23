import { isScopeVertex, OperatorHandler, ScopeNode } from "../rule-processor";
import * as fn from 'fifinet';
import { ModelEntityTypes, RelationshipType } from "@aws-c2a/models";
import { VertexProps } from "fifinet";

/**
 * Ensures vertex t1 has edge 'source' to intermediary dependency relationship vertex, which has edge 'target' to t2 in graph g
 * @param g the Graph
 * @param t1 vertex 1
 * @param t2 vertex 2
 */
export const referencesHandler: OperatorHandler = <V, E>(
    g: fn.Graph<V,E>,
    t1: ScopeNode,
    t2: ScopeNode
): boolean => {
    if(!isScopeVertex(t1) || !isScopeVertex(t2)) return false;

    return g
        .v(t1.vertex._id)
        .inAny("source")
        .filter({_entityType: ModelEntityTypes.relationship, relationshipType: RelationshipType.Dependency } as unknown as VertexProps<V>)
        .outAny("target")
        .run()
        .filter(v => v._id === t2.vertex._id)
        .length > 0;
};

/**
 * Ensures vertex t2 has edge 'source' to intermediary dependency relationship vertex, which has edge 'target' to t1 in graph g
 * @param g the Graph
 * @param t1 vertex 1
 * @param t2 vertex 2
 */
export const isReferencedInHandler: OperatorHandler = <V, E>(
    g: fn.Graph<V,E>,
    t1: ScopeNode,
    t2: ScopeNode
): boolean => {
    return referencesHandler(g, t2, t1);
};