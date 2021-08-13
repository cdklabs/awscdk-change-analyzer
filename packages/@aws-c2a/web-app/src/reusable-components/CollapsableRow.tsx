import { Accordion as MuiAccordion, AccordionDetails, AccordionSummary, Theme, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { ExpandMore as ExpandMoreIcon } from '@material-ui/icons';

import { withStyles } from '@material-ui/styles';
import React, { Ref, useState } from 'react';

const useStyles = makeStyles((theme: Theme) => ({
  wrapper: {
    display: props => props.stickySummary ? 'contents' : 'flex',
    alignItems: 'stretch',
    overflowY: 'hidden',
    height: props => props.expanded && props.stretchOnExpand ? '100%' : 'auto',
  },
  head: {
    'position': 'sticky',
    'top': '0',
    'overflow': 'hidden',
    'maxWidth': '100%',
    'zIndex': 1,
    'backgroundColor': (props: Props) => props.selected ? '#ddd' : props.color ?? '#fff',
    '& > :first-child': {
      alignItems: 'center',
      maxWidth: '100%',
      minWidth: 0,
    },
    '&.Mui-focused': {
      backgroundColor: undefined,
    },
    '&.Mui-expanded': {
      boxShadow: '0px 2px 3px -1px rgba(0,0,0,0.05)',
      backgroundColor: (props: Props) => props.selected ? '#ddd' : props.color ?? '#eee',
    },
  },
  headText: {
    display: 'flex',
    flexDirection: 'column',
    paddingLeft: theme.spacing(1),
    wordWrap: 'break-word',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    flex: '1',
  },
  headDescription: {
    color: theme.palette.text.secondary,
  },
  headIcon: {
    color: 'rgba(0,0,0,0.4)',
    minWidth: '2.1em',
  },
  content: {
    height: '100%',
    padding: 0,
    zIndex: 0,
    display: 'contents',
    overflowY: 'auto',
  },
  root: {
    'border': '0',
    'boxShadow': 'none',
    'display': 'flex',
    'flexDirection': 'column',
    'width': '100%',
    '&:not(:last-child)': {
      borderBottom: 0,
    },
    '&:before': {
      display: 'none',
    },
    '& > :last-child': {
      position: 'sticky',
      overflowY: props => props.stickySummary ? undefined : 'auto',
    },
  },
}));

const Accordion = withStyles({
  root: {
    '&$expanded': {
      margin: '0',
    },
  },
  expanded: {},
})(MuiAccordion);

interface Props {
  icon?: React.ReactNode,
  title: React.ReactNode,
  description?: React.ReactNode,
  content?: React.ReactNode,
  color?: string,
  expanded?: boolean,
  onChange?: (event: React.ChangeEvent<any>, expanded: boolean) => void,
  selected?: boolean,
  stretchOnExpand?: boolean,
  stickySummary?: boolean,
  rightIcon?: React.ReactNode,
  disableAnimation?: boolean
}

const CollapsableRow = React.forwardRef((props: Props, ref?: Ref<HTMLDivElement>) => {

  let {expanded, onChange} = props;
  if(!onChange){
    const expandedUseState = useState(expanded ?? false);
    expanded = expandedUseState[0];
    onChange = (_e, didExpand) => expandedUseState[1](didExpand);
  }
  const {title, description, content, icon, rightIcon} = props;
  const classes = useStyles({...props, expanded});

  return (
    <div ref={ref} className={classes.wrapper}>
      <Accordion
        className={classes.root}
        onChange={onChange}
        expanded={content ? expanded : false}
        TransitionProps={{ unmountOnExit: true, ...props.disableAnimation ? {timeout: 0} : {} }}
      >
        <AccordionSummary className={classes.head} expandIcon={content ? <ExpandMoreIcon /> : <React.Fragment/>}>
          <Typography className={classes.headIcon}>{icon}</Typography>
          <div className={classes.headText}>
            <Typography>{title}</Typography>
            {description && <Typography variant="body2" className={classes.headDescription}>{description}</Typography>}
          </div>
          {rightIcon ? rightIcon : ''}
        </AccordionSummary>
        <AccordionDetails className={classes.content}>
          {content}
        </AccordionDetails>
      </Accordion>
    </div>
  );
});

export default CollapsableRow;