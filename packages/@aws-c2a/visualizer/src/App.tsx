import * as c2a from '@aws-c2a/engine';
import * as models from '@aws-c2a/models';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import * as fn from 'fifinet';
import React, { useEffect, useRef, useState } from 'react';
import './styles/App.css';

cytoscape.use(dagre);

interface HomeProps {
  before: string;
  after: string;
}

const createGraph = (p_before: any, p_after: any): fn.Graph<any, any> => {
  const before = typeof p_before === 'string' ? JSON.parse(p_before) : p_before;
  const after = typeof p_after === 'string' ? JSON.parse(p_after) : p_after;
  const oldModel = new c2a.CDKParser('root', before).parse();
  const newModel = new c2a.CDKParser('root', after).parse();

  const diff = new c2a.DiffCreator(new models.Transition({v1: oldModel, v2: newModel})).create();
  const graph = diff.generateOutgoingGraph();

  return graph;
};

export default function App({before, after}: HomeProps): JSX.Element {
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
            'label': 'data(id)',
          },
        },
      ],
    });
    const eventCb = (event) => {
      setSelected(JSON.stringify(event.target.map(node => node._private.data), null, 2));
    };
    cy.current.on('mouseover', 'node', eventCb);
    cy.current.on('select', 'node', eventCb);
    cy.current.on('select', 'edge', eventCb);
    return () => {
      if (cy.current && !cy.current.destroyed()) {
        cy.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    const _graph = createGraph(before, after);
    setGraph(_graph);
  }, [before, after]);

  useEffect(() => {
    if (cy.current === null || graph === null) return;
    cy.current.elements().remove();
    graph.findVertices().map(v => {
      const {_in, _out, _id, ...data} = v;
      cy.current.add({
        group: 'nodes',
        data: {
          ...data,
          label: _id,
          id: _id,
        },
      });
    });
    graph.findVertices().map(v => {
      graph.findOutEdges(v).map(e => {
        cy.current.add({
          group: 'edges',
          data: {
            label: e._label,
            id: e._id,
            source: e._out._id,
            target: e._in._id,
          },
        });
      });
    });
    cy.current.layout({ name: 'dagre' }).run();
  }, [graph]);

  return (
    <main>
      <div id={'header'}>
        <h1>C2A Graph Visualizer</h1>
        <h3>Selected Node: </h3>
        <pre>{selected}</pre>
      </div>
      <div id={'cy'} className={'canvas'} />
    </main>
  );
}