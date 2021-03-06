import {
  groupArrayBy,
  isDefined,
  CompOpAggCharacteristics,
  ComponentOperation,
  Aggregation,
  RuleRisk,
} from '@aws-c2a/models';
import { List, Paper } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@material-ui/icons';
import React, { useContext, useState } from 'react';
import { AppContext } from '../../App';
import ChangesGroup from '../../reusable-components/ChangesGroup';
import CollapsableRow from '../../reusable-components/CollapsableRow';

const useStyles = makeStyles({
  root: {
    height: '100%',
    maxHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
});

export default function ChangeTree(): JSX.Element {
  const classes = useStyles();
  const [expanded, setExpanded] = useState(0);

  const { changeReport } = useContext(AppContext);

  const aggsPerRisk = groupArrayBy(changeReport.aggregations, (agg) => agg.characteristics.RISK);
  return (
    <Paper elevation={3} className={classes.root} id="aggs-tree-container">
      <CollapsableRow
        icon={<ErrorIcon/>}
        expanded={expanded === 0}
        stretchOnExpand
        onChange={(e, expand) => expand ? setExpanded(0) : setExpanded(-1)}
        title="High Risk Changes"
        content={
          <List disablePadding style={{width: '100%'}}>{
            renderAggs((aggsPerRisk.get(RuleRisk.High) ?? [{}])[0].subAggs ?? [])
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
        content={
          <List disablePadding style={{width: '100%'}}>{
            renderAggs((aggsPerRisk.get(RuleRisk.Unknown) ?? [{}])[0].subAggs ?? [])
          }</List>
        }
        color="#F5E48E"
      />
      <CollapsableRow
        icon={<InfoIcon/>}
        expanded={expanded === 2}
        stretchOnExpand
        onChange={(e, expand) => expand ? setExpanded(2) : setExpanded(-1)}
        title="Low Risk Changes"
        content={
          <List disablePadding style={{width: '100%'}}>{
            renderAggs((aggsPerRisk.get(RuleRisk.Low) ?? [{}])[0].subAggs ?? [])
          }</List>
        }
        color="#C1DEEC"
      />
    </Paper>
  );
}

function renderAggs(aggs: Aggregation<ComponentOperation>[]): JSX.Element[] {
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