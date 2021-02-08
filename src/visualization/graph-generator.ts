import * as graphviz from 'graphviz'
import { InfraModel } from '../infra-model/infra-model'
import { Component } from '../infra-model/component'
import { ComponentGroup } from '../infra-model/component-group'
import { ComponentNode } from '../infra-model/component-node'
import { DependencyRelationship } from '../infra-model/dependency-relationship'

const generateClusterChildren = (graph: graphviz.Graph, componentNode: ComponentNode, addedNodes: Map<Component, graphviz.Node>):void => {
    if(componentNode instanceof ComponentGroup){
        const cluster = graph.addCluster(`cluster${graph.clusterCount()}`)
        cluster.set('label', componentNode.name)
        componentNode.children.forEach(child => {generateClusterChildren(cluster, child.target, addedNodes)})
    } else if (componentNode instanceof Component) {
        if(!addedNodes.has(componentNode)){
            const node = graph.addNode(`node${addedNodes.size}`, {"color" : "blue"} )
            node.set('label', componentNode.name)
            addedNodes.set(componentNode, node)
        }
    }
}

export const generateGraph = (model: InfraModel, outputFilename: string): void => {
    const g = graphviz.digraph("G")
    const nodes = new Map()

    model.componentNodes.forEach(componentNode => {
        if(componentNode instanceof ComponentGroup && componentNode.parents.length === 0) {
            generateClusterChildren(g, componentNode, nodes)
        }
    })

    model.componentNodes.forEach(componentNode => {
        if(componentNode instanceof Component && !nodes.has(componentNode))
            nodes.set(componentNode, g.addNode(`node${nodes.size}`, {"color" : "blue"} ))
    })

    model.relationships.forEach(relationship => {
        if(!(relationship instanceof DependencyRelationship)) return

        const source = nodes.get(relationship.source)
        const target = nodes.get(relationship.target)
        g.addEdge(source, target).set('label', relationship.type)
    })

    //  console.log( g.to_dot() )
    g.output( "png", `${outputFilename}.png` )
}


