import { ComponentOperation, InfraModelDiff, Transition } from "change-cd-iac-models/model-diffing";

import { Component, Relationship, StructuralRelationship } from "change-cd-iac-models/infra-model";
import { isDefined } from "change-cd-iac-models/utils";

export interface VisualHierarchyNode {
    changes: ComponentOperation[],
    compTransition: Transition<Component>,
    innerNodes: VisualHierarchyNode[]
};

export function buildVisualHierarchy(infraModelDiff: InfraModelDiff): VisualHierarchyNode[] {
    return infraModelDiff.componentTransitions
        .filter(t =>
            (t.v2 && ![...t.v2?.incoming].some(r => r instanceof StructuralRelationship))
            || (!t.v2 && ![...t.v1?.incoming ?? []].some(r => r instanceof StructuralRelationship)))
        .map(t => buildVisualHierarchyForComponentTransition(t, infraModelDiff))
        .sort((r1, r2) => (r1.changes.length < r2.changes.length) ? 1 : -1);
}

function buildVisualHierarchyForComponentTransition(
    compTransition: Transition<Component>,
    modelDiff: InfraModelDiff
) : VisualHierarchyNode {

    const innerTransitions = getChildNodes([
        ...compTransition.v2 ? [] : compTransition.v1?.outgoing ?? [],
        ...compTransition.v2?.outgoing ?? []
    ], modelDiff);

    const innerNodes = [...innerTransitions]
        .map(t => buildVisualHierarchyForComponentTransition(t, modelDiff))
        .filter(isDefined)
        .sort((r1, r2) => (r1.changes.length < r2.changes.length) ? 1 : -1);
    
    const changes = innerNodes.reduce((acc, t) => [...acc, ...t.changes], modelDiff.getTransitionOperations(compTransition));
    return {
        changes,
        compTransition,
        innerNodes
    };
}

function getChildNodes(outgoingRelationships: Relationship[], modelDiff: InfraModelDiff): Transition<Component>[]{
    const structuralRelationships = outgoingRelationships.filter(r => r instanceof StructuralRelationship) as StructuralRelationship[];

    return [...new Set(structuralRelationships.map(r => {
        try {
            return modelDiff.getComponentTransition(r.target)
        } catch(e){
            return undefined;
        }
    }).filter(isDefined))];
}