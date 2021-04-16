import { InfraModelDiff, Transition } from "change-cd-iac-models/model-diffing";

import { Component, StructuralRelationship } from "change-cd-iac-models/infra-model";
import { isDefined } from "change-cd-iac-models/utils";

export interface VisualHierarchyNode {
    changesCount: number,
    compTransition: Transition<Component>,
    innerNodes: VisualHierarchyNode[]
};

export function buildVisualHierarchy(infraModelDiff: InfraModelDiff): VisualHierarchyNode[] {
    
    return infraModelDiff.componentTransitions
        .filter(t =>
            ![...t.v2?.incoming ?? []].some(r => r instanceof StructuralRelationship)
            || (!t.v2 && ![...t.v1?.incoming ?? []].some(r => r instanceof StructuralRelationship)))
        .map(t => buildVisualHierarchyForComponentTransition(t, infraModelDiff))
        .sort((r1, r2) => (r1.changesCount < r2.changesCount) ? 1 : -1);
}

function buildVisualHierarchyForComponentTransition(
    compTransition: Transition<Component>,
    modelDiff: InfraModelDiff
) : VisualHierarchyNode {

    const structuralRelationships = [
        ...compTransition.v1?.outgoing ?? [],
        ...compTransition.v2?.outgoing ?? []
    ].filter(r => r instanceof StructuralRelationship) as StructuralRelationship[];

    const innerTransitions = new Set(structuralRelationships.map(r => {
        try {
            return modelDiff.getComponentTransition(r.target)
        } catch(e){
            return undefined;
        }
    }).filter(isDefined));

    const innerNodes = [...innerTransitions]
        .map(t => buildVisualHierarchyForComponentTransition(t, modelDiff))
        .filter(isDefined)
        .sort((r1, r2) => (r1.changesCount < r2.changesCount) ? 1 : -1);
    
    const changesCount = innerNodes.reduce((acc, t) => acc + t.changesCount, modelDiff.getTransitionOperations(compTransition).length);
    return {
        changesCount,
        compTransition,
        innerNodes
    };
}