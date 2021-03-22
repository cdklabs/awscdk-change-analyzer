import React from 'react';
import { Accordion as MuiAccordion, AccordionDetails, AccordionSummary, Box, Theme, Typography } from "@material-ui/core";
import { ExpandMore as ExpandMoreIcon } from '@material-ui/icons';

import { makeStyles } from '@material-ui/core/styles';
import { withStyles } from '@material-ui/styles';

const useStyles = makeStyles((theme: Theme) => ({
  head: {
    backgroundColor: (props: Props) => props.selected ? 'rgba(0,0,0,0.14)' : props.color ?? 'rgba(0,0,0,0)',
    '& :first-child': {
        alignItems: 'center',
    },
    '&.Mui-focused': {
      backgroundColor: undefined,
    },
    '&.Mui-expanded': {
        backgroundColor: (props: Props) => props.color ?? 'rgba(0,0,0,0.06)',
    },
  },
  headText: {
      display: 'flex',
      flexDirection: 'column',
      paddingLeft: theme.spacing(1)
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
        height: '100%',
        '&:not(:last-child)': {
            borderBottom: 0,
        },
        '& :last-child': {
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
    focused: {},
})(MuiAccordion);

interface Props {
    icon?: React.ReactNode,
    title: React.ReactNode,
    description?: React.ReactNode,
    content?: React.ReactNode,
    color?: string,
    expanded?: boolean,
    onChange?: (event: React.ChangeEvent<{}>, expanded: boolean) => void,
    className?: string,
    selected?: boolean
}

const CollapsableRow = (props: Props) => {
    const classes = useStyles(props);
    const {title, description, content, expanded, onChange, className, icon} = props;
    return (
        <div className={className}>
            <Accordion onChange={onChange} expanded={content ? expanded : false} TransitionProps={{ unmountOnExit: true }}>
                <AccordionSummary className={classes.head} expandIcon={content ? <ExpandMoreIcon /> : <React.Fragment/>}>
                    <Typography className={classes.headIcon}>{icon}</Typography>
                    <div className={classes.headText}>
                        <Typography>{title}</Typography>
                        {description && <Typography variant="body2" className={classes.headDescription}>{description}</Typography>}
                    </div>
                </AccordionSummary>
                <AccordionDetails className={classes.content}>
                        {content}
                </AccordionDetails>
            </Accordion>
        </div>
    )
}

export default CollapsableRow;