import React from 'react';
import { Fade, Tooltip, Typography } from '@material-ui/core';
import { DiffHighlightType, DiffStringOutput, Highlights } from '../../selectors/diff-stringifier';

interface Props<T> {
    stringifierOutput: DiffStringOutput<T>,
    flashObj?: T,
    flashRef?: (n: any) => void,
    onClick?: (path: (string | number)[]) => void
    isClickable?: (path: (string | number)[]) => boolean
}

import { makeStyles } from '@material-ui/core/styles';
import { isDefined } from 'change-analysis-models/utils';

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

const clickableStyle = {
    color: '#0066CC',
    cursor: 'pointer',
    textDecoration: 'underline',
    textDecorationSkip: 'spaces', 
}

function DiffSection<T>({stringifierOutput, flashObj, flashRef, onClick, isClickable}: Props<T>) {
    const classes = useStyles();

    return <>{stringifierOutput.map((chunk, i) => {
        if(Array.isArray(chunk)) {
            const hasFlashObj = chunk.some(e => !Array.isArray(e) && highlightsIncludeObj(e.highlights, flashObj));
            return <div
                key={i}
                className={classes.pre}
                ref={hasFlashObj ? flashRef : undefined}
                style={{...hasFlashObj ? flashStyle : {}}}>
                    {<DiffSection stringifierOutput={chunk} flashObj={flashObj} flashRef={flashRef} onClick={onClick} isClickable={isClickable} />}
            </div>
        } else {
            const {str, highlights} = chunk;
            return Object.entries(highlights).length
                ? <Tooltip key={i} title={makeHighlightDescriptions(highlights)} placement="top" arrow TransitionComponent={Fade}>
                        <span
                            onClick={() => onClick && onClick(chunk.path)}
                            style={{
                                ...makeHighlightStyles(Object.keys(highlights) as DiffHighlightType[]),
                                ...(isClickable && isClickable(chunk.path)) ? clickableStyle : {}
                                }}>
                                {str}
                        </span>
                </Tooltip> 
                : <span onClick={() => onClick && onClick(chunk.path)}>{str}</span>
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

function makeHighlightStyles(types: DiffHighlightType[]) {
    return Object.assign({}, ...types.map(h => diffTypeToStyle[h]));
}

export default DiffSection;