import { Component, ComponentOperation, Transition } from '@aws-c2a/models';
import { List, ListItem, Typography } from '@material-ui/core';
import React from 'react';
import { getComponentOperationDescription } from '../selectors/description-generators';

interface Props {
  ops: ComponentOperation[],
}

export const ComponentOperationsList = ({ops}: Props) => {

  const getCompInfo = (ct: Transition<Component>) => {
    const comp = ct.v2 ?? ct.v1;
    if(!comp) throw Error('Component Transition has no components');

    return `${comp.type} ${comp.subtype ?? ''} `;
  };

  return <List>
    {ops.map(op =>
      <ListItem key={op.nodeData._id}>
        <Typography>
          {getCompInfo(op.componentTransition)}
          <br/>
          {getComponentOperationDescription(op)}
        </Typography>
      </ListItem>,
    )}
  </List>;
};