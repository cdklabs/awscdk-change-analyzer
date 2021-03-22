import React, { useState } from 'react';
import { ComponentOperation, InfraModelDiff } from 'change-cd-iac-models/model-diffing';
import ChangeTree from './ChangeTree';
import ChangeDetailsPane from './ChangeDetailsPane';
import { Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { ChangeAnalysisReport } from 'change-cd-iac-models/change-analysis-report';

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
    
    const [selectedIG, setSelectedIG] : [ComponentOperation | undefined, Function] = useState(undefined);

    return (
        <Grid container spacing={0}>
            <Grid item xs={12} md={6} className={classes.panel}>
                <ChangeTree changeReport={changeReport} setSelectedIG={setSelectedIG} selectedIG={selectedIG}/>
            </Grid>
            <Grid item xs={12} md={6} className={classes.panel}>
                <ChangeDetailsPane selectedIG={selectedIG} changeReport={changeReport}/>
            </Grid>
        </Grid>
    );
};
export default App;