import { Grid } from '@material-ui/core';
import { makeStyles, Theme } from '@material-ui/core/styles';
import React from 'react';
import { AppContext } from '../App';
import { useIdAssignerHook } from '../utils/idCreator';
import ChangeDetailsPane from './ChangeDetailsPane/ChangeDetailsPane';
import ChangeTree from './ChangeTree';

const useStyles = makeStyles((theme: Theme) => ({
  fillHeight: {
    height: '100%',
    maxHeight: '100%',
  },
  tree: {
    zIndex: theme.zIndex.drawer-1,
  },
}));

const AggregationsTab = () => {
  const classes = useStyles();

  const idAssigner = useIdAssignerHook();

  return (
    <AppContext.Consumer>{({ selectedAgg, setSelectedAgg }) =>
      <Grid container spacing={0} className={classes.fillHeight}>
        <Grid item xs={12} md={6} lg={4} className={`${classes.fillHeight} ${classes.tree}`}>
          <ChangeTree/>
        </Grid>
        <Grid item xs={12} md={6} lg={8} className={classes.fillHeight}>
          <ChangeDetailsPane key={idAssigner.get(selectedAgg)} agg={selectedAgg}/>
        </Grid>
      </Grid>
    }</AppContext.Consumer>
  );
};
export default AggregationsTab;