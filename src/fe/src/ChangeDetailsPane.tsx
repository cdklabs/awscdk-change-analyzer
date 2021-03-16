import React from 'react';
import { InfraModelDiff } from 'change-cd-iac-models/model-diffing';
import { Grid, makeStyles, Theme, Typography } from '@material-ui/core';
import { ChangeAnalysisReport } from 'change-cd-iac-models/change-analysis-report';

interface props {
    changeReport: ChangeAnalysisReport
}

const useStyles = makeStyles((theme: Theme) => ({
    root: {
        padding: theme.spacing(3),
        height: "100%",
        width: "100%",
    }
}))

function ChangeDetailsPane({changeReport}: props) {
    const classes = useStyles();
    return (
        <Grid container spacing={3} className={classes.root}>
            <Grid item xs={12}>
                <Typography>
                    Change Details
                </Typography>
            </Grid>
        </Grid>
    );
}
export default ChangeDetailsPane;