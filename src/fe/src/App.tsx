import React from 'react';
import { InfraModelDiff } from 'change-cd-iac-models/model-diffing';
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
    return (
        <Grid container spacing={0}>
            <Grid item xs={12} md={6} className={classes.panel}>
                <ChangeTree changeReport={changeReport} />
            </Grid>
            <Grid item xs={12} md={6} className={classes.panel}>
                <ChangeDetailsPane changeReport={changeReport}/>
            </Grid>
        </Grid>
    );
};
export default App;