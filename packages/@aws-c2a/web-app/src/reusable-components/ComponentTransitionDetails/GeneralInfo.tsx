import { Component } from '@aws-c2a/models/infra-model';
import { ComponentOperation, Transition } from '@aws-c2a/models/model-diffing';
import { Typography } from '@material-ui/core';
import React from 'react';
import { mostRecentInTransition } from '../../selectors/component-transition-helpers';
import { ComponentDetails } from './ComponentDetails';

interface Props {
  compTransition: Transition<Component>,
  highlightOperation?: ComponentOperation,
}

export const GeneralInfo = ({compTransition, highlightOperation}: Props) => {
  return <>
    <Typography><b>{mostRecentInTransition(compTransition).type}</b> {mostRecentInTransition(compTransition).subtype ?? ''}</Typography>
    <br/>
    {compTransition.v1 ? <>
      <Typography><b>Old Version</b></Typography>
      <ComponentDetails component={compTransition.v1}/>
    </> : ''}
    <br/>
    {compTransition.v2 ? <>
      <Typography><b>New Version</b></Typography>
      <ComponentDetails component={compTransition.v2}/>
    </> : ''}
  </>;
};