import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import CollapsableRow from './CollapsableRow';
import { List, Paper, Typography } from '@material-ui/core';

import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ListAltRounded
} from '@material-ui/icons';
import { ChangeAnalysisReport } from 'change-cd-iac-models/change-analysis-report';
import ChangesGroup from './ChangesGroup';
import { CompOpIGCharacteristics, IsomorphicGroup } from 'change-cd-iac-models/isomorphic-groups';
import { ComponentOperation } from 'change-cd-iac-models/model-diffing';
import { isDefined } from 'change-cd-iac-models/utils';

const useStyles = makeStyles({
  root: {
    height: '100%',
    maxHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  row: {
    alignItems: 'stretch',
    overflowY: 'hidden',
  },
  selected: {
    height: '100%',
  }
});

interface props {
    changeReport: ChangeAnalysisReport
}

function ChangeTree({changeReport}: props) {
    const classes = useStyles();
    const [expanded, setExpanded] = useState(0);
    return (
        <Paper elevation={3} className={classes.root}>
            <CollapsableRow
              icon={<ErrorIcon/>}
              className={`${expanded === 0 ? classes.selected : ''} ${classes.row}`}
              expanded={expanded === 0}
              onChange={(e, expand) => expand ? setExpanded(0) : setExpanded(-1)}
              title="High Risk Changes"
              content={
                <List disablePadding style={{width: '100%'}}>{
                  renderIGs(changeReport.isomorphicGroups)
                }</List>
              }
              color="#EA9B9A"
            />
            <CollapsableRow
              icon={<WarningIcon/>}
              className={`${expanded === 1 ? classes.selected : ''} ${classes.row}`}
              expanded={expanded === 1}
              onChange={(e, expand) => expand ? setExpanded(1) : setExpanded(-1)}
              title="Medium Risk Changes"
              content={"asd"}
              color="#F5E48E"
            />
            <CollapsableRow
              icon={<InfoIcon/>}
              className={`${expanded === 2 ? classes.selected : ''} ${classes.row}`}
              expanded={expanded === 2}
              onChange={(e, expand) => expand ? setExpanded(2) : setExpanded(-1)}
              title="Low Risk Changes"
              content={"asd"}
              color="#C1DEEC"
            />
        </Paper>
    );
}

function renderIGs(igs: IsomorphicGroup<ComponentOperation>[]){
  const baseCharacteristics = [CompOpIGCharacteristics.COMPONENT_TYPE, CompOpIGCharacteristics.COMPONENT_SUBTYPE];
  const igAccumulator = (igs: IsomorphicGroup<ComponentOperation>[], requiredCharacteristics: string[]) =>
    igs.flatMap((ig: IsomorphicGroup<ComponentOperation>): IsomorphicGroup<ComponentOperation>[] => {
      const nonFoundCs = requiredCharacteristics.filter(c => !ig.characteristics[c]);
      if(nonFoundCs.length && ig.subGroups){
        return igAccumulator(ig.subGroups, nonFoundCs).map(i => ({...i, characteristics: {...i.characteristics, ...ig.characteristics}}));
      }
      return [ig];
    });

  return igAccumulator(igs, baseCharacteristics).map(ig => {
    const operationTypes = [ig, ...igAccumulator(ig.subGroups ?? [], [CompOpIGCharacteristics.OPERATION_TYPE])].map(ig => ig.characteristics[CompOpIGCharacteristics.OPERATION_TYPE]).filter(isDefined);
    const subCharacteristics = Object.entries(ig.characteristics).filter(([c]) => !baseCharacteristics.includes(c as CompOpIGCharacteristics) && (c !== CompOpIGCharacteristics.OPERATION_TYPE || operationTypes.length > 1));
    return <ChangesGroup
      ig={subCharacteristics.length > 0 ? {...ig, subGroups: [{...ig, characteristics: Object.fromEntries(subCharacteristics)}]} : ig}
      title={`${ig.characteristics[CompOpIGCharacteristics.COMPONENT_TYPE]} ${ig.characteristics[CompOpIGCharacteristics.COMPONENT_SUBTYPE] || ''}`}
      description={operationTypes.join(', ')}
    />
  });
}


export default ChangeTree;