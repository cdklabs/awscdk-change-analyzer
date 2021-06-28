import { Box, Card, CardContent, IconButton, Tooltip, Typography } from "@material-ui/core";
import { ComponentOperation } from "change-cd-iac-models/model-diffing"
import React from "react";
import CollapsableRow from "./CollapsableRow"

import { makeStyles } from '@material-ui/core/styles';
import { mostRecentInTransition } from "../selectors/component-transition-helpers";
import { useIdAssignerHook } from "../utils/idCreator";
import { AppContext } from "../App";
import { getComponentOperationDescription } from "../selectors/description-generators";

const useStyles = makeStyles({
    root: {
        minWidth: 275,
    },
    title: {
        fontSize: 14,
    },
    pos: {
        marginBottom: 12,
    },
});

interface Props {
    op: ComponentOperation,
}

const SingleChange = ({op}: Props) => {
    const classes = useStyles();

    const idAssigner = useIdAssignerHook();

    const componentTypeAndSubtype = `${mostRecentInTransition(op.componentTransition).type} ${mostRecentInTransition(op.componentTransition).subtype ?? ''}`

    return <AppContext.Consumer>{({ setSelectedChange }) => 
        <Card className={classes.root} onClick={() => setSelectedChange(op)}>
            <CardContent>
                <Typography className={classes.title} color="textSecondary" gutterBottom>
                    Change
                </Typography>
                <Typography variant="h5" component="h2">
                    {componentTypeAndSubtype}
                </Typography>
                <Typography className={classes.pos} color="textSecondary">
                    {getComponentOperationDescription(op)}
                </Typography>
                <Typography variant="body2" component="p">
                    
                </Typography>
            </CardContent>
        </Card>
      }</AppContext.Consumer>
}

export default SingleChange;