import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { List, Paper } from '@material-ui/core';
import { AppContext } from '../App';
import { buildVisualHierarchy } from '../selectors/hierarchy-builder';
import HierarchicalNode from './HierarchicalNode';

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
                {buildVisualHierarchy(changeReport.infraModelDiff).map((n) =>
                    <HierarchicalNode key={n.compTransition.nodeData._id} node={n}/>
                )}
            </List>
        </Paper>
      }</AppContext.Consumer>
    );
}

export default HierarchicalTree;