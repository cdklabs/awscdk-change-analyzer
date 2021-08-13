import { List, Paper } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useContext } from 'react';
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

export default function HierarchicalTree(): JSX.Element {
  const classes = useStyles();
  const {changeReport} = useContext(AppContext);

  return (
    <Paper elevation={3} className={classes.root}>
      <List disablePadding style={{width: '100%'}}>
        {buildVisualHierarchy(changeReport.infraModelDiff).map((n) =>
          <HierarchicalNode key={n.compTransition.nodeData._id} node={n}/>,
        )}
      </List>
    </Paper>
  );
}