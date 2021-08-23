import { GetStaticProps } from 'next';
import * as c2a from '@aws-c2a/engine';
import * as models from '@aws-c2a/models';
import * as fn from 'fifinet';
import React, { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout';
import styles from '../styles/Home.module.scss';
import cytoscape from 'cytoscape';

cytoscape.use(require('cytoscape-dagre'));

interface HomeProps {
  before: any;
  after: any;
}

const createGraph = (before: any, after: any): fn.Graph<any, any> => {
  const oldModel = new c2a.CDKParser('root', before).parse();
  const newModel = new c2a.CDKParser('root', after).parse();

  const diff = new c2a.DiffCreator(new models.Transition({v1: oldModel, v2: newModel})).create();
  const graph = diff.generateOutgoingGraph();

  return graph;
}

export default function Home({before, after}: HomeProps): JSX.Element {
  const [selected, setSelected] = useState<string | null>(null);
  const [ graph, setGraph ] = useState<fn.Graph<any, any> | null>(null);
  const cy = useRef<cytoscape | null>(null);

  useEffect(() => {
    cy.current = cytoscape({
      container: document.getElementById('cy'),
      layout: {
        name: 'dagre',
      },
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#666',
            'label': 'data(id)'
          }
        },
      ]
    });
    cy.current.on('select', 'node', (event) => {
      console.log(event.target.map(node => node._private.data));
      setSelected(JSON.stringify(event.target.map(node => node._private.data), null, 2));
    })
    return () => {
      if (cy.current && !cy.current.destroyed()) {
        cy.current.destroy();
      }
    }
  }, []);

  useEffect(() => {
    const _graph = createGraph(before, after);
    setGraph(_graph);
  }, [before, after]);
  
  useEffect(() => {
    if (cy.current === null || graph === null) return;
    cy.current.elements().remove();
    graph.findVertices().map(v => {
      console.log(v);
      const {_in, _out, _id, ...data} = v;
      cy.current.add({
        group: 'nodes',
        data: {
          ...data,
          label: _id,
          id: _id,
        }
      });
    });
    graph.findVertices().map(v => {
      graph.findOutEdges(v).map(e => {
        cy.current.add({
          group: 'edges',
          data: {
            id: e._id,
            source: e._out._id,
            target: e._in._id,
          }
        })
      })
    })
    cy.current.layout({ name: 'dagre' }).run();
  }, [graph]);

  return (
    <Layout id={styles.container}>
      <div id={styles.header}>
        <h1>C2A Graph Visualizer</h1>
        <h3>Selected Node: </h3>
        <pre>{selected}</pre>
      </div>
      <div id={'cy'} className={styles.canvas} />
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = () => {
  const before = require('../data/before.json');
  const after = require('../data/after.json');
  return {
    props: { before, after},
  };
}