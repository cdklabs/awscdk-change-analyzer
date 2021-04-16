import React, { Ref, useState } from 'react';
import { Accordion as MuiAccordion, AccordionDetails, AccordionSummary, Box, Theme, Typography } from "@material-ui/core";
import { ExpandMore as ExpandMoreIcon } from '@material-ui/icons';

import { makeStyles } from '@material-ui/core/styles';
import { withStyles } from '@material-ui/styles';

const useStyles = makeStyles((theme: Theme) => ({
  wrapper: {
    display: props => props.stickySummary ? 'contents' : 'flex',
    alignItems: 'stretch',
    overflowY: 'hidden',
    height: props => props.expanded && props.stretchOnExpand ? '100%' : 'auto',
  },
  head: {
    position: 'sticky',
    top: '0',
    overflow: 'hidden',
    maxWidth: '100%',
    margin: props => props.expanded && props.stickySummary ? theme.spacing(0,0,1,0) : 0,
    backgroundColor: (props: Props) => props.selected ? '#ddd' : props.color ?? '#fff',
    '& > :first-child': {
        alignItems: 'center',
        maxWidth: '100%',
        minWidth: 0,
    },
    '&.Mui-focused': {
        backgroundColor: undefined,
    },
    '&.Mui-expanded': {
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
      color: "rgba(0,0,0,0.4)",
      minWidth: "2.1em",
  },
  content: {
    height: '100%',
    padding: 0,
    overflowY: 'auto',
    boxShadow: 'inset 2px 3px -1px rgba(0,0,0,0.6)',
  },
}));

const Accordion = withStyles({
    root: {
        border: '0',
        boxShadow: 'none',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',  
        '&:not(:last-child)': {
            borderBottom: 0,
        },
        '& > :last-child': {
            overflowY: 'auto',
        },
        '&:before': {
            display: 'none',
        },
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
    onChange?: (event: React.ChangeEvent<{}>, expanded: boolean) => void,
    selected?: boolean,
    stretchOnExpand?: boolean,
    stickySummary?: boolean,
    rightIcon?: React.ReactNode,
}

const CollapsableRow = React.forwardRef((props: Props, ref?: Ref<HTMLDivElement>) => {
    
    let {expanded, onChange} = props;
    if(!onChange){
        const expandedUseState = useState(expanded ?? false);
        expanded = expandedUseState[0];
        onChange = (e, expanded) => expandedUseState[1](expanded);
    }
    const {title, description, content, icon, rightIcon} = props;
    const classes = useStyles({...props, expanded});

    return (
        <div ref={ref} className={classes.wrapper}>
            <Accordion onChange={onChange} expanded={content ? expanded : false} TransitionProps={{ unmountOnExit: true }}>
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
    )
});

export default CollapsableRow;