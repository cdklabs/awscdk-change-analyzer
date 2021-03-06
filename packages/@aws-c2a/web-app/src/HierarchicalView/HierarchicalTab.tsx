import { Grid } from '@material-ui/core';
import { makeStyles, Theme } from '@material-ui/core/styles';
import React from 'react';
import { AppContext } from '../App';
import HierarchicalDetailsPane from './HieralchicalDetailsPane';
import HierarchicalTree from './HierarchicalTree';

const useStyles = makeStyles((theme: Theme) => ({
  fillHeight: {
    height: '100%',
    maxHeight: '100%',
  },
  tree: {
    zIndex: theme.zIndex.drawer-1,
  },
}));

export default function HierarchicalTab(): JSX.Element {
  const classes = useStyles();

  return (
    <Grid container spacing={0} className={classes.fillHeight}>
      <Grid item xs={12} md={6} lg={4} className={`${classes.fillHeight} ${classes.tree}`}>
        <HierarchicalTree />
      </Grid>
      <AppContext.Consumer>{({changeReport, selectedCompTransition}) =>
        <Grid item xs={12} md={6} lg={8} className={classes.fillHeight}>
          <HierarchicalDetailsPane
            componentTransition={selectedCompTransition}
            componentOps={selectedCompTransition &&
              changeReport.infraModelDiff.getTransitionOperations(selectedCompTransition)} />
        </Grid>
      }</AppContext.Consumer>
    </Grid>
  );
}
