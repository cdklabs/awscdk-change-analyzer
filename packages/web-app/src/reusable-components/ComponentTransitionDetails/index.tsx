import React, { ReactElement, useEffect, useRef, useState } from 'react';
import { ComponentOperation, PropertyComponentOperation, Transition } from 'cdk-change-analyzer-models/model-diffing';
import { Component } from 'cdk-change-analyzer-models/infra-model';
import ComponentPropertyDiff from '../ComponentPropertyDiff';
import { makeStyles, Paper, Tab, Tabs, Tooltip, Typography } from '@material-ui/core';
import { Theme } from '@material-ui/core';
import {
    Code as CodeIcon,
    ArrowRightAlt as ArrowRightAltIcon,
    Info as InfoIcon,
    DeviceHub as DeviceHubIcon,
    ChangeHistory as ChangeHistoryIcon,
} from '@material-ui/icons';
import { isDefined } from 'cdk-change-analyzer-models/utils';
import { CompTransitionDependencyRelationships } from './ComponentTransitionDependencyRelationships';
import { ComponentOperationCauses } from './ComponentOperationCauses';
import { ComponentTransitionChanges } from './ComponentTransitionChanges';
import { GeneralInfo } from './GeneralInfo';

interface Props {
    componentTransition: Transition<Component>,
    highlightOperation?: ComponentOperation,
    showReferences?: boolean,
}

interface Panel {
    icon: ReactElement,
    content: React.ReactNode,
    condition?: boolean,
}

const useStyle = makeStyles((theme: Theme) => ({
    container: {
        position: 'relative',
        display: 'contents',
    },
    tabs: {
        position: 'sticky',
        top: 0,
        zIndex: theme.zIndex.drawer
    },
    tab: {
        minWidth: 'auto'
    },
    contentTitle: {
        fontWeight: 'bold',
        width: '100%',
    },
    content: {
        width: '100%',
        padding: theme.spacing(2),
        boxSizing: 'border-box'
    },
}));

function ComponentTransitionDetails({componentTransition, highlightOperation, showReferences}: Props) {
    const classes = useStyle();

    const panels: Record<string, Panel> = {
        "Source Definition": {
            icon: <CodeIcon/>,
            content: <ComponentPropertyDiff
                componentTransition={componentTransition}
                propertyOp={highlightOperation instanceof PropertyComponentOperation ? highlightOperation : undefined} />,
        },
        "General Info": {
            icon: <InfoIcon/>,
            content: <GeneralInfo compTransition={componentTransition} highlightOperation={highlightOperation}/>,
        },
        "Causal Chain": {
            icon: <ArrowRightAltIcon/>,
            content: highlightOperation && <ComponentOperationCauses op={highlightOperation} />,
            condition: highlightOperation !== undefined
        },
        "References": {
            icon: <DeviceHubIcon/>,
            content: <CompTransitionDependencyRelationships componentTransition={componentTransition}/>,
            condition: !!showReferences
        },
        "Changes": {
            icon: <ChangeHistoryIcon/>,
            content: <ComponentTransitionChanges compTransition={componentTransition}/>,
            condition: highlightOperation === undefined
        }
    }

    const [selectedPanel, setSelectedPanel] = useState(Object.keys(panels).find(title => panels[title].condition !== false));
    const menuRef = useRef<HTMLButtonElement>(null);
    const [menuTop, setMenuTop] = useState(0);
    useEffect(() => {
        if((menuRef.current?.offsetParent as HTMLElement)?.offsetTop){
            setMenuTop((menuRef.current?.offsetParent as HTMLElement)?.offsetTop)
        }
    }, [menuRef.current?.offsetParent])

    return <div className={classes.container}>
        <Paper className={classes.tabs} ref={menuRef} style={{top: menuTop}}>
            <Tabs
                value={selectedPanel}
                onChange={(ev, s) => setSelectedPanel(s)}
                indicatorColor="primary"
                textColor="primary"
                variant="scrollable"
                scrollButtons="auto"
            >
                {Object.entries(panels).map(([title, {icon, condition}]) =>
                    condition !== false &&
                        <Tab className={classes.tab} key={title} label={
                            <div style={{display: 'flex', alignItems: 'center', gap: 5}}>
                                {icon}
                                {title}
                            </div>
                        } value={title}/>
                ).filter(isDefined)}
            </Tabs>
        </Paper>
        <div className={classes.content}>
            {selectedPanel !== undefined && <>
                {panels[selectedPanel].content}
            </>}
        </div>
    </div>;
}

export default ComponentTransitionDetails;