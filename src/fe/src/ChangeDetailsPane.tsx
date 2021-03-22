import React from 'react';
import { ComponentOperation, PropertyComponentOperation } from 'change-cd-iac-models/model-diffing';
import { Box, Divider, Grid, makeStyles, Theme, Typography } from '@material-ui/core';
import { ChangeAnalysisReport } from 'change-cd-iac-models/change-analysis-report';
import { IsomorphicGroup } from 'change-cd-iac-models/isomorphic-groups';

interface props {
    changeReport: ChangeAnalysisReport,
    selectedIG?: IsomorphicGroup<ComponentOperation>
}

const useStyles = makeStyles((theme: Theme) => ({
    root: {
        padding: theme.spacing(0),
        margin: 0
    },
    contentWrapper: {
        overflow: 'auto',
    },
    fillParent: {
        maxHeight: '100%',
        width: '100%',
        maxWidth: '100%',
        height: "100%",
    },
    operationName: {
        padding: theme.spacing(2)
    }
}))

function ChangeDetailsPane({changeReport, selectedIG}: props) {
    const classes = useStyles();
    return (
        <Grid container spacing={3} className={`${classes.root} ${classes.fillParent}`}>
            <Grid item xs={12}>
                <Typography>
                    Change Details
                </Typography>
            </Grid>
            <Divider />
            {selectedIG
                && (<Box className={classes.fillParent}>
                    {[...selectedIG.entities].map(op => (
                    <>
                        <Grid item xs={12} className={classes.operationName}>
                            <Typography variant="h6">
                                {selectedIG
                                    ? (op.componentTransition.v2?.name || op.componentTransition.v1?.name)
                                    : ''
                                }
                            </Typography>
                        </Grid>
                        
                        <Divider />
                        <Grid item xs={12} className={`${classes.contentWrapper} ${classes.fillParent}`}>
                            <Typography>
                                <pre>
                                    {JSON.stringify(
                                        op instanceof PropertyComponentOperation
                                        ? {'Property Path': op.pathTransition, 'Property Value': op.propertyTransition}
                                        : op.componentTransition, null, 4)}
                                </pre>
                            </Typography>
                        </Grid>
                    </>
                    ))}
                </Box>)}
        </Grid>
    );
}
export default ChangeDetailsPane;