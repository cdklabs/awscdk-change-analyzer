import React, { useState } from 'react';
import { ComponentOperation, Transition } from 'change-cd-iac-models/model-diffing';
import { Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Aggregation } from 'change-cd-iac-models/aggregations';
import { useIdAssignerHook } from '../utils/idCreator';
import HierarchicalTree from './HierarchicalTree';
import { Component } from 'change-cd-iac-models/infra-model';
import HierarchicalDetailsPane from './HieralchicalDetailsPane';
import { AppContext } from '../App';


interface HierarchicalViewState {
    selectedCompTransition?: Transition<Component>,
    setSelectedCompTransition: Function
}

export const HierarchicalViewContext = React.createContext({} as HierarchicalViewState);

const useStyles = makeStyles({
  fillHeight: {
    height: '100%',
    maxHeight: '100%',
  },
});

const HierarchicalTab = ({selectedCompTransition, setSelectedCompTransition}: HierarchicalViewState) => {
    const classes = useStyles();

    const idAssigner = useIdAssignerHook();
    
    return (
        <HierarchicalViewContext.Provider
            value={{ selectedCompTransition, setSelectedCompTransition }}
        >
            <AppContext.Consumer>{({changeReport}) => 
            <Grid container spacing={0} className={classes.fillHeight}>
                <Grid item xs={12} md={6} lg={4} className={classes.fillHeight}>
                    <HierarchicalTree />
                </Grid>
                <Grid item xs={12} md={6} lg={8} className={classes.fillHeight}>
                    <HierarchicalDetailsPane key={idAssigner.get(selectedCompTransition)} componentTransition={selectedCompTransition} componentOps={selectedCompTransition && changeReport.infraModelDiff.getTransitionOperations(selectedCompTransition)} />
                </Grid>
            </Grid>
            }</AppContext.Consumer>
        </HierarchicalViewContext.Provider>
    );
};
export default HierarchicalTab;