import React from 'react';
import { ComponentOperation, PropertyComponentOperation, Transition } from 'change-cd-iac-models/model-diffing';
import { Typography } from '@material-ui/core';
import { AppContext } from '../../App';
import { getPropertyDiff } from '../../selectors/getPropertyDiff';
import { ChangeAnalysisReport } from 'change-cd-iac-models/change-analysis-report';
import { Component } from 'change-cd-iac-models/infra-model';
import { DiffHighlightType } from '../../selectors/diff-stringifier';

interface Props {
    componentTransition: Transition<Component>,
}

import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
  pre: {
    wordWrap: 'break-word',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    overflow: 'hidden',
    maxWidth: '100%',
  },
});

function ChangesDiff({componentTransition}: Props) {
    const classes = useStyles();
    return (
        <AppContext.Consumer>{({changeReport}) =>
            <Typography>
                <pre className={classes.pre}>
                    {
                        renderPropertyDiff(componentTransition, changeReport)
                    }
                </pre>
            </Typography>
        }</AppContext.Consumer>
    );
}

function renderPropertyDiff(componentTransition: Transition<Component>, changeReport: ChangeAnalysisReport){
    const chunks = getPropertyDiff({v1: componentTransition.v1?.properties, v2: componentTransition.v2?.properties},
        changeReport.infraModelDiff.getTransitionOperations(componentTransition)?.filter((o: ComponentOperation) => o instanceof PropertyComponentOperation) as PropertyComponentOperation[]
    );

    const diffTypeToColor: Record<DiffHighlightType, string> = {
        [DiffHighlightType.Insert]: '#0f0',
        [DiffHighlightType.Remove]: '#f88',
        [DiffHighlightType.Update]: '#88f',
    }
    
    return chunks.map(({str, highlights}) => <span style={{backgroundColor: diffTypeToColor[highlights[0]]}}>{str}</span>);
}

export default ChangesDiff;