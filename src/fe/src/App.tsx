import React, { useState } from 'react';
import { ComponentOperation, InfraModelDiff } from 'change-cd-iac-models/model-diffing';
import ChangeTree from './ChangeTree';
import ChangeDetailsPane from './ChangeDetailsPane/ChangeDetailsPane';
import { Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { ChangeAnalysisReport } from 'change-cd-iac-models/change-analysis-report';
import { Aggregation } from 'change-cd-iac-models/aggregations';


interface AppState {
    selectedAgg?: Aggregation<ComponentOperation>,
    setSelectedAgg?: (agg?: Aggregation<ComponentOperation>) => void,
}

export const AppContext = React.createContext({} as AppState);


const useStyles = makeStyles({
  panel: {
    height: '100vh'
  },
});

interface props {
    changeReport: ChangeAnalysisReport
}

const App = ({changeReport}: props) => {
    const classes = useStyles();

    const [selectedAgg, setSelectedAgg] = useState(undefined as Aggregation<ComponentOperation> | undefined);

    return (
        <AppContext.Provider
            value={{ selectedAgg, setSelectedAgg }}
        >
            <Grid container spacing={0}>
                <Grid item xs={12} md={6} className={classes.panel}>
                    <ChangeTree changeReport={changeReport}/>
                </Grid>
                <Grid item xs={12} md={6} className={classes.panel}>
                    <ChangeDetailsPane agg={selectedAgg}/>
                </Grid>
            </Grid>
        </AppContext.Provider>
    );
};
export default App;