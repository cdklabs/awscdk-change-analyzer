import * as graphviz from 'graphviz';
import { InfraModel } from '../infra-model/infra-model';
import { Component } from '../infra-model/component';
import { DependencyRelationship } from '../infra-model/dependency-relationship';
import { StructuralRelationship } from '../infra-model/structural-relationship';
import * as fs from 'fs';
import * as path from 'path';

const generateClusterChildren = (
    graph: graphviz.Graph,
    component: Component,
    nodes: Map<Component, graphviz.Node>,
    clusterIds: Map<Component, string>
):void => {
    if(!nodes.has(component)){
        const structuralChildren = Array.from(component.outgoing).filter(r => r instanceof StructuralRelationship);

        if(structuralChildren.length > 0) {
            const clusterId = `cluster${clusterIds.size}`;
            graph = graph.addCluster(clusterId);
            graph.set('label', component.name);
            clusterIds.set(component, clusterId);
            const node = graph.addNode(`node${nodes.size}`, {shape: "point", height: "0"} );
            nodes.set(component, node);
            component.outgoing.forEach(relationship => generateClusterChildren(graph, relationship.target, nodes, clusterIds));
        } else {
            const node = graph.addNode(`node${nodes.size}`, {color : "blue", label: component.name} );
            nodes.set(component, node);
        }
    }
};

export const generateGraph = (model: InfraModel, outputFilename: string): void => {
    const g = graphviz.digraph("G");
    g.set('compound', true);
    const nodes: Map<Component, graphviz.Node> = new Map();
    const clusterIds: Map<Component, string> = new Map();

    model.components.forEach(component => {
        if(component.incoming.size === 0) {
            generateClusterChildren(g, component, nodes, clusterIds);
        }
    });

    model.components.forEach(component => {
        if(!nodes.has(component))
            nodes.set(component, g.addNode(`node${nodes.size}`, {"color" : "blue"} ));
    });

    model.relationships.forEach(relationship => {
        if(!(relationship instanceof DependencyRelationship)) return;

        const source = nodes.get(relationship.source);
        const target = nodes.get(relationship.target);
        if(source && target && !clusterIds.has(relationship.source)){
            const edge = g.addEdge(source, target, { label: relationship.type });

            const targetCluster = clusterIds.get(relationship.target);
            if(typeof targetCluster === 'string')
                edge.set("lhead", targetCluster);
        }
    });
    
    const outputDirectory = path.dirname(outputFilename);
    if (!fs.existsSync(outputDirectory)){
        fs.mkdirSync(outputDirectory);
    }

    g.output( "png", `${outputFilename}.png` );
};


