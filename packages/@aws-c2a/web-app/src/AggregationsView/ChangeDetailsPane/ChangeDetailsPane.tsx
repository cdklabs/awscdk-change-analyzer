import {
  Aggregation,
  getAllCharacteristics,
  ComponentOperation,
  CompOpAggCharacteristics,
} from '@aws-c2a/models';
import { Box, IconButton, makeStyles, Theme, Tooltip, Typography } from '@material-ui/core';
import { Launch as LaunchIcon } from '@material-ui/icons';
import React from 'react';
import { AppContext } from '../../App';
import ApproveChangeBtn from '../../reusable-components/ApproveChangeBtn';
import CollapsableRow from '../../reusable-components/CollapsableRow';
import ComponentTransitionDetails from '../../reusable-components/ComponentTransitionDetails';
import { mostRecentInTransition, getComponentStructuralPath } from '../../selectors/component-transition-helpers';
import { useIdAssignerHook } from '../../utils/idCreator';

interface props {
  agg?: Aggregation<ComponentOperation>,
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

function ChangeDetailsPane({agg}: props) {
  const classes = useStyles();

  const descriptions = agg && agg.descriptions;
  const characteristics = agg && getAllCharacteristics(agg);

  const idAssigner = useIdAssignerHook();

  return <AppContext.Consumer>{({showComponentInHierarchy}) =>
    !agg
      ? <Box className={`${classes.fillParent} ${classes.emptyRoot}`}>Select a set of changes to view their details</Box>
      : <Box className={`${classes.root} ${classes.fillParent}`}>
        <Box className={classes.header}>
          {characteristics !== undefined
            ? <>
              <Typography variant="h5" className={classes.mainCharacteristicDescription}>
                {(characteristics && characteristics[CompOpAggCharacteristics.OPERATION_TYPE]) ?? 'Changes'}
                <b>{characteristics && ` ${characteristics[CompOpAggCharacteristics.COMPONENT_TYPE]} ${characteristics[CompOpAggCharacteristics.COMPONENT_SUBTYPE] ?? ''}`}</b>
              </Typography>
              {descriptions && descriptions.length &&
                                <Typography className={classes.characteristicDescription}>{descriptions[descriptions.length - 1]}</Typography>
              }
            </>
            : <Typography variant="h5" className={classes.mainCharacteristicDescription}>
                            Changes
            </Typography>
          }

          <Typography className={classes.ocurrencesTitle} variant="h6">Occurrences ({agg.entities.size}):</Typography>
        </Box>
        <Box className={`${classes.fillParent} ${classes.occurrences}`}>
          {[...agg.entities].map((op,i) =>
            <CollapsableRow
              stickySummary
              key={idAssigner.get(op)}
              expanded={agg.entities.size === 1}
              icon={`${i+1}.`}
              disableAnimation
              rightIcon={<>
                <Tooltip title="Open in Hierarchical View">
                  <IconButton size="small" onClick={() => showComponentInHierarchy(op.componentTransition)}>
                    <LaunchIcon/>
                  </IconButton>
                </Tooltip>
                <ApproveChangeBtn changes={op}/>
              </>}
              title={<b>{getComponentStructuralPath(mostRecentInTransition(op.componentTransition))}</b>}
              content={
                <ComponentTransitionDetails componentTransition={op.componentTransition} highlightOperation={op} showReferences/>
              }
            />,
          )}
        </Box>
      </Box>
  }</AppContext.Consumer>;
}
export default ChangeDetailsPane;