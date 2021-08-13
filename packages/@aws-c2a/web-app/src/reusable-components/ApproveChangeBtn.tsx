import { ComponentOperation, RuleAction } from '@aws-c2a/models';
import { IconButton, makeStyles, Tooltip } from '@material-ui/core';
import { Done as DoneIcon, DoneAll as DoneAllIcon, Clear as ClearIcon } from '@material-ui/icons';
import React, { ReactEventHandler, useContext } from 'react';

import { AppContext } from '../App';

const useStyles = makeStyles({
  rejected: {
    color: '#F00',
  },
  approved: {
    color: '#0B0',
  },
});

type Props = {
  changes: ComponentOperation | ComponentOperation[],
}

const ApproveChangeBtn = ({changes}: Props) => {

  const changesArr = Array.isArray(changes) ? changes : [changes];

  const hasMultiple = changesArr.length > 1;

  const { approvedChanges, setChangesApproval } = useContext(AppContext);

  const state: RuleAction = changesArr.reduce((acc: RuleAction, c) => {
    const s = approvedChanges.get(c);
    if(acc === RuleAction.Reject || s === RuleAction.Reject) return RuleAction.Reject;
    if(!s || s === RuleAction.None || acc === RuleAction.None) return RuleAction.None;
    return RuleAction.Approve;
  }, RuleAction.Approve);

  const onClick: ReactEventHandler = (e) => {
    e.stopPropagation();
    if(state === RuleAction.Reject) return;
    setChangesApproval(changesArr, state === RuleAction.Approve ? RuleAction.None : RuleAction.Approve);
  };

  const classes = useStyles();

  if(state === RuleAction.Reject) {
    return <Tooltip title={'This change was explicitly rejected by this project\'s rules. It cannot be approved'}>
      <IconButton className={classes.rejected} size="small" onClick={(e) => e.stopPropagation()}>{
        <ClearIcon/>
      }</IconButton>
    </Tooltip>;
  }

  const approveTooltipTitle = `Approve ${hasMultiple ? 'these changes' : 'this change'}`;
  const unApproveTooltipTitle = `${hasMultiple ? 'These changes have' : 'This change has'} been approved`;

  return <Tooltip title={state === RuleAction.Approve ? unApproveTooltipTitle : approveTooltipTitle}>
    <IconButton className={state === RuleAction.Approve ? classes.approved : ''} size="small" onClick={onClick} >{
      hasMultiple
        ? <DoneAllIcon/>
        : <DoneIcon/>
    }</IconButton>
  </Tooltip>;
};

export default ApproveChangeBtn;