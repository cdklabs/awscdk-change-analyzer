import React, { useState } from 'react';
import { ComponentOperation } from 'change-cd-iac-models/model-diffing';
import ChangeTree from './ChangeTree';
import ChangeDetailsPane from './ChangeDetailsPane/ChangeDetailsPane';
import { Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Aggregation } from 'change-cd-iac-models/aggregations';
import { useIdAssignerHook } from '../utils/idCreator';


interface AggregationsState {
    selectedAgg?: Aggregation<ComponentOperation>,
    setSelectedAgg?: (agg?: Aggregation<ComponentOperation>) => void
}

export const AggregationsContext = React.createContext({} as AggregationsState);

const useStyles = makeStyles({
  fillHeight: {
    height: '100%',
    maxHeight: '100%',
  },
});

const AggregationsTab = () => {
    const classes = useStyles();

    const [selectedAgg, setSelectedAgg] = useState(undefined as Aggregation<ComponentOperation> | undefined);

    const idAssigner = useIdAssignerHook();
    
    return (
        <AggregationsContext.Provider
            value={{ selectedAgg, setSelectedAgg }}
        >
            <Grid container spacing={0} className={classes.fillHeight}>
                <Grid item xs={12} md={6} lg={4} className={classes.fillHeight}>
                    <ChangeTree/>
                </Grid>
                <Grid item xs={12} md={6} lg={8} className={classes.fillHeight}>
                    <ChangeDetailsPane key={idAssigner.get(selectedAgg)} agg={selectedAgg}/>
                </Grid>
            </Grid>
        </AggregationsContext.Provider>
    );
};
export default AggregationsTab;