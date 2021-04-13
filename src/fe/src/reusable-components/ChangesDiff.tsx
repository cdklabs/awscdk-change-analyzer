import React, { useCallback } from 'react';
import { Fade, Tooltip, Typography } from '@material-ui/core';
import { DiffHighlightType, DiffStringOutput, Highlights } from '../selectors/diff-stringifier';

interface Props<T> {
    stringifierOutput: DiffStringOutput<T>,
    flashObj?: T,
}

import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
  pre: {
    wordWrap: 'break-word',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    overflow: 'hidden',
    maxWidth: '100%',
    margin: 0,
  },
});

function ChangesDiff<T>({stringifierOutput, flashObj}: Props<T>) {
    const classes = useStyles();

    const opRef = useCallback(node => {
        if(node?.scrollIntoView){
            node.scrollIntoView({block: 'end', behavior: 'smooth'});
            node.style.backgroundColor = 'transparent';
            node.style.boxShadow = '0 0 0.5em 0.5em transparent';
        }
    },[]);

    return (
        <Typography className={classes.pre}>
            {
                renderPropertyDiff(stringifierOutput, (r) => opRef(r), flashObj)
            }
        </Typography>
    );
}

function renderPropertyDiff<T>(stringifierOutput: DiffStringOutput<T>, opRef: (node: any) => void, flashObj?: T): React.ReactNode[]{

    const classes = useStyles();

    const diffTypeToStyle: Record<DiffHighlightType, React.CSSProperties> = {
        [DiffHighlightType.Insert]: {backgroundColor: '#0f0'},
        [DiffHighlightType.Remove]: {backgroundColor: '#f88'},
        [DiffHighlightType.Update]: {border: '2px solid #00f'},
    }

    const flashStyle = {
        backgroundColor: 'yellow',
        boxShadow: '0 0 0.5em 0.5em yellow',
        transition: 'background-color 2s ease-in-out, box-shadow 2s ease-in-out'
    };

    return stringifierOutput.map((chunk) => {
        if(Array.isArray(chunk)) {
            const hasFlashObj = chunk.some(e => !Array.isArray(e) && highlightsIncludeObj(e.highlights, flashObj));
            return <pre
                className={classes.pre}
                ref={hasFlashObj ? opRef : undefined}
                style={{...hasFlashObj ? flashStyle : {}}}>
                    {renderPropertyDiff(chunk, opRef, flashObj)}
            </pre>
        } else {
            const {str, highlights} = chunk;
            return Object.entries(highlights).length
                ? <Tooltip title={makeHighlightDescriptions(highlights)} placement="top" arrow TransitionComponent={Fade}>
                        <span style={Object.assign({}, ...(Object.keys(highlights) as DiffHighlightType[]).map(h => diffTypeToStyle[h]))}>
                                {str}
                        </span>
                </Tooltip> 
                : str
        }
    });  
}

function highlightsIncludeObj<T>(highlights: Highlights<T>, op?: T){
    if(op === undefined) return false;
    return Object.values(highlights).flat().some(o => o === op);
}

function makeHighlightDescriptions<T>(highlights: Highlights<T>): string {
    return Object.keys(highlights).join(', ');
}

export default ChangesDiff;