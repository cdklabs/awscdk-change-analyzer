import { Button, List, ListItem, makeStyles, Theme, Typography } from "@material-ui/core";
import { Component, DependencyRelationship } from "@aws-c2a/models/infra-model";
import { Transition } from "@aws-c2a/models/model-diffing";
import React from "react";
import { useContext } from "react";
import { AppContext } from "../../App";
import {
    ArrowForward as ArrowForwardIcon,
    RadioButtonChecked as RadioButtonCheckedIcon
} from '@material-ui/icons';
import { getComponentStructuralPath, mostRecentInTransition } from "../../selectors/component-transition-helpers";

interface Props {
    componentTransition: Transition<Component>,
};

const useStyles = makeStyles((theme: Theme) => ({
    container: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(2)
    },
    item: {
        flex: '1 1 0',
        textAlign: 'center'
    },
    midItem: {
        flex: '0 1 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    referenceBtnWrapper: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        gap: theme.spacing(2),
        padding: theme.spacing(0.5)
    },
    referenceBtn: {
        flexGrow: 1,
        textAlign: 'center',
        wordBreak: 'break-word',
        textTransform: 'none', 
    }
}));

export const CompTransitionDependencyRelationships = ({ componentTransition }: Props) => {
    const classes = useStyles();
    
    const {changeReport, showComponentInHierarchy} = useContext(AppContext);
    const getTransitionFromComponent = changeReport.infraModelDiff.getComponentTransition.bind(changeReport.infraModelDiff);
    
    const outgoing = [...new Set([componentTransition.v2?.outgoing ?? [], componentTransition.v1?.outgoing ?? []]
        .flatMap(rels => [...rels].filter(rel => rel instanceof DependencyRelationship).map(rel => getTransitionFromComponent(rel.target))))];
    const incoming = [...new Set([componentTransition.v2?.incoming ?? [], componentTransition.v1?.incoming ?? []]
        .flatMap(rels => [...rels].filter(rel => rel instanceof DependencyRelationship).map(rel => getTransitionFromComponent(rel.source))))];
    
        
    const generateListItem = (compTransition: Transition<Component>, {before, after}: {before?: React.ReactNode, after?: React.ReactNode} = {}) => 
        <div className={classes.referenceBtnWrapper}>
            {before ?? ''}
            <Button variant="outlined" color="primary" className={classes.referenceBtn} onClick={() => showComponentInHierarchy(compTransition)}>
                {getComponentStructuralPath(mostRecentInTransition(compTransition))}
            </Button>
            {after ?? ''}
        </div>

    if(outgoing.length + incoming.length === 0) return <Typography>(No references to or from this object)</Typography>

    return <div className={classes.container}>
        {incoming.length ? <div className={classes.item}>
                <Typography>Referenced in:</Typography>
                {incoming.map(c => generateListItem(c, {after: <ArrowForwardIcon/>}))}
        </div> : ''}
        <div className={`${classes.item} ${classes.midItem}`}>
            <RadioButtonCheckedIcon/>
            <Typography>(this)</Typography>
        </div>
        {outgoing.length ? <div className={classes.item}>
                <Typography>References:</Typography>
                {outgoing.map(c => generateListItem(c, {before: <ArrowForwardIcon/>}))}
        </div> : ''}
    </div>
}