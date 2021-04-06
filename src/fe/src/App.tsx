import React, { useState } from 'react';
import { Tab, Tabs, AppBar } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { ChangeAnalysisReport } from 'change-cd-iac-models/change-analysis-report';
import AggregationsTab from './AggregationsView/AggregationsTab';
import HierarchicalTab from './HierarchicalView/HierarchicalTab';
import { Component } from 'change-cd-iac-models/infra-model';
import { Transition } from 'change-cd-iac-models/model-diffing';


interface AppState {
    changeReport: ChangeAnalysisReport,
    showComponentInHierarchy: (comp: Transition<Component>) => void
}

export const AppContext = React.createContext({} as AppState);


const useStyles = makeStyles({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
  },
  panel: {
    height: '100%',
    maxHeight: '100%',
    overflow: 'hidden',
    flexGrow: 1
  },
});

interface props {
    changeReport: ChangeAnalysisReport
}

const App = ({changeReport}: props) => {
    const classes = useStyles();

    const [selectedTab, setSelectedTab] = useState(0);
    
    const [selectedCompTransition, setSelectedCompTransition] = useState(undefined as Transition<Component> | undefined);

    const showComponentInHierarchy = (comp: Transition<Component>) => {
        setSelectedTab(1);
        setSelectedCompTransition(comp);
    };

    return (
        <AppContext.Provider
            value={{ changeReport, showComponentInHierarchy }}
        >
            <div className={classes.wrapper}>
                <AppBar position="static" color="transparent">
                    <Tabs value={selectedTab} onChange={(e, v) => setSelectedTab(v)} aria-label="simple tabs example">
                        <Tab label="All Changes" />
                        <Tab label="Hierarchical View" />
                    </Tabs>
                </AppBar>
                <div className={classes.panel} hidden={selectedTab !== 0}>
                    <AggregationsTab />
                </div>
                <div className={classes.panel} hidden={selectedTab !== 1}>
                    <HierarchicalTab selectedCompTransition={selectedCompTransition} setSelectedCompTransition={setSelectedCompTransition}/>
                </div>
            </div>
        </AppContext.Provider>
    );
};
export default App;