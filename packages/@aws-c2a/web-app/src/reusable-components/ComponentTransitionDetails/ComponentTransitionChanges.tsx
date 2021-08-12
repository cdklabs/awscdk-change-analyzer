import { Component } from '@aws-c2a/models/infra-model';
import { Transition } from '@aws-c2a/models/model-diffing';
import { List, Typography } from '@material-ui/core';
import React from 'react';
import { useContext } from 'react';
import { AppContext } from '../../App';
import { useIdAssignerHook } from '../../utils/idCreator';
import ChangesGroup from '../ChangesGroup';

interface Props {
  compTransition: Transition<Component>,
}

export const ComponentTransitionChanges = ({compTransition}: Props) => {

  const { aggregationsPerComponent } = useContext(AppContext).changeReport;
  const aggregations = aggregationsPerComponent.get(compTransition);
  const idAssigner = useIdAssignerHook();

  return <List>
    {
      aggregations && aggregations.length ? aggregations.map(
        agg => <ChangesGroup key={idAssigner.get(agg)} agg={agg}/>,
      ) : <Typography>'This object has suffered no changes'</Typography>
    }
  </List>;
};