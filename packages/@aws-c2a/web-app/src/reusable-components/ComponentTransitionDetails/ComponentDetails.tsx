import { Component} from '@aws-c2a/models';
import { Typography } from '@material-ui/core';
import React from 'react';
import { getComponentStructuralPath} from '../../selectors/component-transition-helpers';

interface Props {
  component: Component,
}

export const ComponentDetails = ({component}: Props) => {
  return <>
    <Typography>Name: {component.name}</Typography>
    <Typography>Path: {getComponentStructuralPath(component)}</Typography>
  </>;
};