import { Component, Transition } from '@aws-c2a/models';
import { List, Typography } from '@material-ui/core';
import React, { useContext } from 'react';
import { AppContext } from '../../App';
import { useIdAssignerHook } from '../../utils/idCreator';
import ChangesGroup from '../ChangesGroup';

interface Props {
  compTransition: Transition<Component>,
}

export function ComponentTransitionChanges({compTransition}: Props): JSX.Element {

  const { aggregationsPerComponent } = useContext(AppContext).changeReport;
  const aggregations = aggregationsPerComponent.get(compTransition);
  const idAssigner = useIdAssignerHook();

  return <List>
    {
      aggregations && aggregations.length ? aggregations.map(
        agg => <ChangesGroup key={idAssigner.get(agg)} agg={agg}/>,
      ) : <Typography>&lsquo;This object has suffered no changes&rsquo;</Typography>
    }
  </List>;
}