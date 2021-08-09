import React, { useEffect, useState } from 'react';
import { Tab, Tabs, AppBar } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { ChangeAnalysisReport } from 'cdk-change-analyzer-models/change-analysis-report';
import AggregationsTab from './AggregationsView/AggregationsTab';
import HierarchicalTab from './HierarchicalView/HierarchicalTab';
import { Component, ComponentPropertyValue } from 'cdk-change-analyzer-models/infra-model';
import { ComponentOperation, Transition } from 'cdk-change-analyzer-models/model-diffing';
import { Aggregation } from 'cdk-change-analyzer-models/aggregations';
import { findAggregationWithChange } from './selectors/aggregation-helpers';
import { RuleAction } from 'cdk-change-analyzer-models/rules';

import { JSONDeserializer } from 'cdk-change-analyzer-models/export/json-deserializer';

interface AppState {
    changeReport?: ChangeAnalysisReport,
    showComponentInHierarchy: (comp: Transition<Component>) => void,
    selectedCompTransition?: Transition<Component>,
    setSelectedCompTransition: Function,
    selectedAgg?: Aggregation<ComponentOperation>,
    setSelectedAgg: Function,
    setSelectedChange: Function,
    showAggregation: Function,
    setChangesApproval: Function,
    approvedChanges: Map<ComponentOperation, RuleAction>,
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


const App = () => {
    const classes = useStyles();

    const [changeReport, setChangeReport] = useState<ChangeAnalysisReport | undefined>(undefined);
    const [selectedTab, setSelectedTab] = useState(0);
    
    const [selectedCompTransition, setSelectedCompTransition] = useState(undefined as Transition<Component> | undefined);
    const [selectedAgg, setSelectedAgg] = useState(undefined as Aggregation<ComponentOperation> | undefined);

    const [approvedChanges, setApprovedChanges] = useState<Map<ComponentOperation, RuleAction>>(new Map());

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch('data.json');
            const report = await response.json();
            const deserializedReport = new JSONDeserializer<ChangeAnalysisReport>().deserialize(JSON.stringify(report));
            setChangeReport(deserializedReport);
        }
        fetchData();
    }, []);

    useEffect(() => {
        if (changeReport)
            setApprovedChanges(new Map([...changeReport.rulesOutput]
                .map(([op, effect]) => [op, effect.action ?? RuleAction.None])
            ))
    }, [changeReport]);
    
    const showComponentInHierarchy = (comp: Transition<Component>) => {
        setSelectedTab(1);
        setSelectedCompTransition(comp);
    };

    const showAggregation = (agg: Aggregation<ComponentOperation>) => {
        setSelectedTab(0);
        setSelectedAgg(agg);
    };

    const setSelectedChange = (op: ComponentOperation) => {
        const agg = findAggregationWithChange(op, changeReport?.aggregations ?? []);
        if(agg)
            showAggregation(agg);
    }

    const setChangesApproval = (changes: ComponentOperation[], state: RuleAction) => {
        setApprovedChanges(new Map([...approvedChanges, ...changes.map(c => [c, state] as const)]));
    }
    
    return (
        <AppContext.Provider
            value={{
                changeReport,
                showComponentInHierarchy,
                selectedCompTransition,
                setSelectedCompTransition,
                selectedAgg,
                setSelectedAgg,
                setSelectedChange,
                showAggregation,
                setChangesApproval,
                approvedChanges
            }}
        >
            <div className={classes.wrapper}>
                <AppBar position="static" color="transparent">
                    <Tabs value={selectedTab} onChange={(e, v) => setSelectedTab(v)} aria-label="simple tabs example">
                        <Tab label="All Changes" id="all-changes-tab" />
                        <Tab label="Hierarchical View" id="hierarchical-view-tab" />
                    </Tabs>
                </AppBar>
                <div className={classes.panel} hidden={selectedTab !== 0}>
                    <AggregationsTab />
                </div>
                <div className={classes.panel} hidden={selectedTab !== 1}>
                    <HierarchicalTab />
                </div>
            </div>
        </AppContext.Provider>
    );
};
export default App;