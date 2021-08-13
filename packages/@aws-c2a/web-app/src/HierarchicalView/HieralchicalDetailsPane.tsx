import { Component, ComponentOperation, Transition } from '@aws-c2a/models';
import { Box, makeStyles, Theme, Typography } from '@material-ui/core';
import React from 'react';
import { AppContext } from '../App';
import ComponentTransitionDetails from '../reusable-components/ComponentTransitionDetails';
import { getComponentOperationsDescription } from '../selectors/description-generators';

interface props {
  componentTransition?: Transition<Component>,
  componentOps?: ComponentOperation[],
}

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  emptyRoot: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    padding: theme.spacing(1),
    backgroundColor: theme.palette.background.default,
  },
  ocurrencesTitle: {
    padding: theme.spacing(1, 0, 0, 1),
  },
  occurrences: {
    overflowX: 'hidden',
    overflowY: 'auto',
    height: '100%',
    padding: theme.spacing(0, 2),
  },
  occurrenceContent: {
    width: '100%',
    padding: theme.spacing(0, 2),
  },
  fillParent: {
    maxHeight: '100%',
    width: '100%',
    maxWidth: '100%',
    height: '100%',
    boxSizing: 'border-box',
  },
  mainCharacteristicDescription: {
    margin: theme.spacing(1),
  },
  characteristicDescription: {
    margin: theme.spacing(0.5, 1),
  },
}));

function HierarchicalDetailsPane({componentTransition}: props) {
  const classes = useStyles();

  return <AppContext.Consumer>{({changeReport}) =>
    !componentTransition
      ? <Box className={`${classes.fillParent} ${classes.emptyRoot}`}>Select an item to view its details</Box>
      : <Box className={`${classes.root} ${classes.fillParent}`}>
        <Box className={classes.header}>
          <Typography variant="h5" className={classes.mainCharacteristicDescription}>
            <b>{componentTransition.v2?.name ?? componentTransition.v1?.name}</b>
          </Typography>
          <Typography className={classes.characteristicDescription}>
            {componentTransition.v2?.type ?? componentTransition.v1?.type} {componentTransition.v2?.subtype ?? componentTransition.v1?.subtype ?? ''}
            <br/>
            <b>{getComponentOperationsDescription(componentTransition, changeReport)}</b>
          </Typography>
          <Typography className={classes.ocurrencesTitle} variant="h6">Details:</Typography>
        </Box>
        <Box className={`${classes.fillParent} ${classes.occurrences}`}>
          {
            <ComponentTransitionDetails componentTransition={componentTransition} showReferences/>
          }
        </Box>
      </Box>
  }</AppContext.Consumer>;
}
export default HierarchicalDetailsPane;