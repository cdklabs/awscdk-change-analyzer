import React from 'react';
import { ComponentOperation, PropertyComponentOperation } from 'change-cd-iac-models/model-diffing';
import { Accordion, AccordionDetails, AccordionSummary, Box, Chip, Divider, Grid, makeStyles, Theme, Typography } from '@material-ui/core';
import { ChangeAnalysisReport } from 'change-cd-iac-models/change-analysis-report';
import { Aggregation, getAllDescriptions } from 'change-cd-iac-models/aggregations';
import ChangesDiff from './ChangesDiff';
import CollapsableRow from '../reusable-components/CollapsableRow';

interface props {
    agg?: Aggregation<ComponentOperation>,
}

const useStyles = makeStyles((theme: Theme) => ({
    root: {
        padding: theme.spacing(1),
        margin: 0,
        display: 'flex',
        flexDirection: 'column'
    },
    emptyRoot: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    contentWrapper: {
        padding: theme.spacing(2)
    },
    occurrences: {
        overflowY: 'auto',
        overflowX: 'hidden',
    },
    fillParent: {
        maxHeight: '100%',
        width: '100%',
        maxWidth: '100%',
        height: "100%",
        boxSizing: 'border-box',
    },
    mainCharacteristicDescription: {
        margin: theme.spacing(1)
    },
    characteristicDescription: {
        margin: theme.spacing(0.5, 1),
    }
}))

function ChangeDetailsPane({agg}: props) {
    const classes = useStyles();

    const descriptions = agg && getAllDescriptions(agg);

    return !agg
            ? <Box className={`${classes.fillParent} ${classes.emptyRoot}`}>Select a set of changes to view their details</Box> 
            : <Box className={`${classes.root} ${classes.fillParent}`}>
                <Box>
                    {descriptions && descriptions[0]
                        ? <> 
                            <Typography variant="h5" className={classes.mainCharacteristicDescription}>
                                Changes to <b>{descriptions[0]}</b>
                            </Typography>
                            {descriptions && descriptions.slice(1).map(description => 
                                <><Typography className={classes.characteristicDescription}>{description}</Typography></>
                            )}
                        </>
                        : <Typography variant="h5" className={classes.mainCharacteristicDescription}>
                            Changes
                        </Typography>
                    }
                    
                </Box>
                <Box className={`${classes.fillParent} ${classes.contentWrapper}`}>
                    <Typography variant="h6">Occurrences:</Typography>
                    <Box className={classes.occurrences}>
                    {[...agg.entities].map((op,i) =>
                        <CollapsableRow
                            icon={`${i+1}.`}
                            title={<b>{(op.componentTransition.v2?.name || op.componentTransition.v1?.name)}</b>}
                            content={<ChangesDiff operation={op} />}
                        />
                    )}
                    </Box>
                </Box>
            </Box>;
}
export default ChangeDetailsPane;