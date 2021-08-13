import { ComponentOperation } from '@aws-c2a/models';
import { Card, CardContent, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';

import { AppContext } from '../App';
import { mostRecentInTransition } from '../selectors/component-transition-helpers';
import { getComponentOperationDescription } from '../selectors/description-generators';

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

export default function SingleChange({op}: Props): JSX.Element {
  const classes = useStyles();

  const componentTypeAndSubtype = `${mostRecentInTransition(op.componentTransition).type} ${mostRecentInTransition(op.componentTransition).subtype ?? ''}`;

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
  }</AppContext.Consumer>;
}
