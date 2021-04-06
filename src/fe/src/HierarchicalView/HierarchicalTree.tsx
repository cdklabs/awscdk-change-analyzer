import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import CollapsableRow from '../reusable-components/CollapsableRow';
import { Badge, IconButton, List, Paper, Tooltip } from '@material-ui/core';

import { InfraModelDiff, Transition } from 'change-cd-iac-models/model-diffing';
import { isDefined } from 'change-cd-iac-models/utils';
import { AppContext } from '../App';
import { Component, StructuralRelationship } from 'change-cd-iac-models/infra-model';
import { HierarchicalViewContext } from './HierarchicalTab';

import UpdateIcon from '@material-ui/icons/Update';
import { DoneOutline as DoneOutlineIcon } from '@material-ui/icons';

const useStyles = makeStyles({
  root: {
    height: '100%',
    maxHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
});

function HierarchicalTree() {
    const classes = useStyles();

    return (
      <AppContext.Consumer>{({changeReport}) =>
        <Paper elevation={3} className={classes.root}>
            <List disablePadding style={{width: '100%'}}>
                {renderTree(changeReport.infraModelDiff)}
            </List>
        </Paper>
      }</AppContext.Consumer>
    );
}

function renderTree(modelDiff: InfraModelDiff, ){
  return modelDiff.componentTransitions
        .filter(t =>
            [   ...(t.v2?.outgoing || [])]
                .filter(r => r instanceof StructuralRelationship).length
            && (!t.v1?.incoming.size || !t.v2?.incoming.size)
        ).map(t => renderTransition(t, modelDiff, new Set())?.reactNode)
        .filter(isDefined);
}

function renderTransition(
    compTransition: Transition<Component>,
    modelDiff: InfraModelDiff,
    parentsSet: Set<Transition<Component>>
) : {reactNode: React.ReactNode, operations: number} | undefined{

    const structuralRelationships = [
        //...compTransition.v1?.outgoing ?? [],
        ...compTransition.v2?.outgoing ?? []
    ].filter(r => r instanceof StructuralRelationship) as StructuralRelationship[];

    const innerTransitions = new Set(structuralRelationships.map(r => {
        try {
            return modelDiff.getComponentTransition(r.target)
        } catch(e){
            return undefined;
        }
    }).filter(isDefined));

    for(const t of innerTransitions) { // TODO CHECK WHY THERE ARE CIRCULAR DEPENDENCIES
        if(parentsSet.has(t)) return;
    }

    const renderedInnerTransitions = [...innerTransitions]
        .map(t => renderTransition(t, modelDiff, new Set([...parentsSet, compTransition])))
        .filter(isDefined)
        .sort((r1, r2) => (r1.operations < r2.operations) ? 1 : -1);
    
    const opsCount = renderedInnerTransitions.reduce((acc, t) => acc+t.operations, modelDiff.getTransitionOperations(compTransition).length);
    return {
        operations: opsCount,
        reactNode: <HierarchicalViewContext.Consumer>{({selectedCompTransition, setSelectedCompTransition}) =>
            <CollapsableRow
                icon={<Badge badgeContent={opsCount} color="secondary"><UpdateIcon/></Badge>}
                title={compTransition.v2?.name || compTransition.v1?.name}
                rightIcon={<Tooltip title="Approve this change"><IconButton size="small"><DoneOutlineIcon/></IconButton></Tooltip>}
                description={`${compTransition.v2?.type || compTransition.v1?.type} ${compTransition.v2?.subtype ?? compTransition.v1?.subtype ?? ''}`}
                content={renderedInnerTransitions.length > 0 ? <List style={{marginLeft: '2.5em', width: 'calc(100% - 2.5em)'}}>
                    {renderedInnerTransitions.map(t => t.reactNode)}
                </List> : undefined}
                selected={selectedCompTransition === compTransition}
                onChange={(ev, e) => setSelectedCompTransition(compTransition)}
            />
        }</HierarchicalViewContext.Consumer>
    }
}


export default HierarchicalTree;