import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import CollapsableRow from '../../reusable-components/CollapsableRow';
import { List, Paper, Typography } from '@material-ui/core';

import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@material-ui/icons';
import ChangesGroup from '../../reusable-components/ChangesGroup';
import { CompOpAggCharacteristics, Aggregation } from 'change-cd-iac-models/aggregations';
import { ComponentOperation } from 'change-cd-iac-models/model-diffing';
import { isDefined } from 'change-cd-iac-models/utils';
import { AppContext } from '../../App';
import { useIdAssignerHook, ObjIdAssigner } from '../../utils/idCreator';

const useStyles = makeStyles({
  root: {
    height: '100%',
    maxHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
});

function ChangeTree() {
    const classes = useStyles();
    const [expanded, setExpanded] = useState(0);

    const idAssigner = useIdAssignerHook();

    return (
      <AppContext.Consumer>{({changeReport}) =>
        <Paper elevation={3} className={classes.root}>
            <CollapsableRow
              icon={<ErrorIcon/>}
              expanded={expanded === 0}
              stretchOnExpand
              onChange={(e, expand) => expand ? setExpanded(0) : setExpanded(-1)}
              title="High Risk Changes"
              content={
                <List disablePadding style={{width: '100%'}}>{
                  renderAggs(changeReport.aggregations, idAssigner)
                }</List>
              }
              color="#EA9B9A"
            />
            <CollapsableRow
              icon={<WarningIcon/>}
              expanded={expanded === 1}
              stretchOnExpand
              onChange={(e, expand) => expand ? setExpanded(1) : setExpanded(-1)}
              title="Unclassified Risk Changes"
              content={"asd"}
              color="#F5E48E"
            />
            <CollapsableRow
              icon={<InfoIcon/>}
              expanded={expanded === 2}
              stretchOnExpand
              onChange={(e, expand) => expand ? setExpanded(2) : setExpanded(-1)}
              title="Low Risk Changes"
              content={"asd"}
              color="#C1DEEC"
            />
        </Paper>
      }</AppContext.Consumer>
    );
}

function renderAggs(aggs: Aggregation<ComponentOperation>[], idAssigner: ObjIdAssigner){
  return aggs.map((agg, i) => <ChangesGroup
      key={i}
      agg={agg}
      title={`${agg.characteristics[CompOpAggCharacteristics.COMPONENT_TYPE]} ${agg.characteristics[CompOpAggCharacteristics.COMPONENT_SUBTYPE] || ''}`}
      description={
        agg.characteristics[CompOpAggCharacteristics.OPERATION_TYPE]
        ? agg.characteristics[CompOpAggCharacteristics.OPERATION_TYPE]
        : [...new Set(agg.subAggs?.map(sg => sg.characteristics[CompOpAggCharacteristics.OPERATION_TYPE]))]
          .filter(isDefined).join(', ')
      }
    />);
}


export default ChangeTree;