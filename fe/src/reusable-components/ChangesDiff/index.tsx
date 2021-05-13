import React, { useCallback } from 'react';
import { Typography } from '@material-ui/core';
import { DiffStringOutput } from '../../selectors/diff-stringifier';

interface Props<T> {
    stringifierOutput: DiffStringOutput<T>,
    flashObj?: T,
}

import { makeStyles } from '@material-ui/core/styles';
import DiffSection from './DiffSection';

const useStyles = makeStyles((theme) => ({
  pre: {
    fontFamily: 'monospace',
    fontSize: theme.typography.body1.fontSize,
    lineHeight: theme.typography.body2.lineHeight,
    wordWrap: 'break-word',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    overflow: 'hidden',
    maxWidth: '100%',
    margin: 0,
  },
}));

function ChangesDiff<T>({stringifierOutput, flashObj}: Props<T>) {
    const classes = useStyles();

    const opRef = useCallback(node => {
        if(node?.scrollIntoView){
            node.scrollIntoView({block: 'end', behavior: 'smooth'});
            //uncomment to make the diff highlighting slowly disappear
            //node.style.backgroundColor = 'transparent';
            //node.style.boxShadow = '0 0 0.5em 0.5em transparent';
        }
    },[]);

    return (
        <div className={classes.pre}>
                <DiffSection stringifierOutput={stringifierOutput} flashRef={(r) => opRef(r)} flashObj={flashObj}/>
        </div>
    );
}

export default ChangesDiff;