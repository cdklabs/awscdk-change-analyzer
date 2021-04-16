import React from 'react';
import { Fade, Tooltip, Typography } from '@material-ui/core';
import { DiffHighlightType, DiffStringOutput, Highlights } from '../../selectors/diff-stringifier';

interface Props<T> {
    stringifierOutput: DiffStringOutput<T>,
    flashObj?: T,
    flashRef?: (n: any) => void
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

function DiffSection<T>({stringifierOutput, flashObj, flashRef}: Props<T>) {
    const classes = useStyles();

    return <>{stringifierOutput.map((chunk, i) => {
        if(Array.isArray(chunk)) {
            const hasFlashObj = chunk.some(e => !Array.isArray(e) && highlightsIncludeObj(e.highlights, flashObj));
            return <div
                key={i}
                className={classes.pre}
                ref={hasFlashObj ? flashRef : undefined}
                style={{...hasFlashObj ? flashStyle : {}}}>
                    {<DiffSection stringifierOutput={chunk} flashObj={flashObj} flashRef={flashRef} />}
            </div>
        } else {
            const {str, highlights} = chunk;
            return Object.entries(highlights).length
                ? <Tooltip key={i} title={makeHighlightDescriptions(highlights)} placement="top" arrow TransitionComponent={Fade}>
                        <span style={Object.assign({}, ...(Object.keys(highlights) as DiffHighlightType[]).map(h => diffTypeToStyle[h]))}>
                                {str}
                        </span>
                </Tooltip> 
                : str
        }
    })}</>;  
};

function highlightsIncludeObj<T>(highlights: Highlights<T>, op?: T){
    if(op === undefined) return false;
    return Object.values(highlights).flat().some(o => o === op);
}

function makeHighlightDescriptions<T>(highlights: Highlights<T>): string {
    return Object.keys(highlights).join(', ');
}

export default DiffSection;