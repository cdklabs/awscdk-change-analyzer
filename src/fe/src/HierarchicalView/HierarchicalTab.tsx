import React from 'react';
import { Transition } from 'change-cd-iac-models/model-diffing';
import { Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import HierarchicalTree from './HierarchicalTree';
import { Component } from 'change-cd-iac-models/infra-model';
import HierarchicalDetailsPane from './HieralchicalDetailsPane';
import { AppContext } from '../App';

interface HierarchicalViewState {
    selectedCompTransition?: Transition<Component>,
    setSelectedCompTransition: Function,
}

export const HierarchicalViewContext = React.createContext({} as HierarchicalViewState);

const useStyles = makeStyles({
  fillHeight: {
    height: '100%',
    maxHeight: '100%',
  },
});

const HierarchicalTab = () => {
    const classes = useStyles();

    return (
        <Grid container spacing={0} className={classes.fillHeight}>
            <Grid item xs={12} md={6} lg={4} className={classes.fillHeight}>
                <HierarchicalTree />
            </Grid>
            <AppContext.Consumer>{({changeReport, selectedCompTransition}) => 
                <Grid item xs={12} md={6} lg={8} className={classes.fillHeight}>
                    <HierarchicalDetailsPane componentTransition={selectedCompTransition} componentOps={selectedCompTransition && changeReport.infraModelDiff.getTransitionOperations(selectedCompTransition)} />
                </Grid>
            }</AppContext.Consumer>
        </Grid>
    );
};
export default HierarchicalTab;