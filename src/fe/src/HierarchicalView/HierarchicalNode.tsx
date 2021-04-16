import React, { Ref, useContext, useEffect, useRef, useState } from 'react';
import CollapsableRow from '../reusable-components/CollapsableRow';
import { Badge, IconButton, List, Tooltip } from '@material-ui/core';

import UpdateIcon from '@material-ui/icons/Update';
import { DoneOutline as DoneOutlineIcon } from '@material-ui/icons';
import { VisualHierarchyNode } from '../selectors/hierarchy-builder';
import { AppContext } from '../App';
import { Transition } from 'change-cd-iac-models/model-diffing';
import { Component } from 'change-cd-iac-models/infra-model';

interface Props {
    node: VisualHierarchyNode,
}

function HierarchicalNode({node}: Props) {

    const {changesCount, compTransition, innerNodes} = node;

    const {selectedCompTransition} = useContext(AppContext);
    const [isExpanded, setExpanded] = useState(false);

    const ref = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        setExpanded(isNodeExpanded(selectedCompTransition, node));
        if(node.compTransition === selectedCompTransition && ref.current?.scrollIntoView){
            ref.current?.scrollIntoView({block: 'end', behavior: 'smooth'});
        }
    }, [selectedCompTransition]);


    return (
        <AppContext.Consumer>{({setSelectedCompTransition}) =>
            <CollapsableRow
                ref={ref}
                icon={<Badge badgeContent={changesCount} color="secondary"><UpdateIcon/></Badge>}
                title={compTransition.v2?.name || compTransition.v1?.name}
                rightIcon={<Tooltip title="Approve this change"><IconButton size="small"><DoneOutlineIcon/></IconButton></Tooltip>}
                description={`${compTransition.v2?.type || compTransition.v1?.type} ${compTransition.v2?.subtype ?? compTransition.v1?.subtype ?? ''}`}
                content={innerNodes.length > 0 ?
                    <List disablePadding style={{marginLeft: '2.5em', width: 'calc(100% - 2.5em)'}}>
                        {innerNodes.map(n => <HierarchicalNode key={n.compTransition.nodeData._id} node={n}/>)}
                    </List>
                    : undefined}
                selected={selectedCompTransition === compTransition}
                onChange={(ev, e) => (setExpanded(e), e && (setSelectedCompTransition(compTransition)))}
                expanded={isExpanded}
            />
        }</AppContext.Consumer>
    );
}

function isNodeExpanded(selectedCompTransition?: Transition<Component>, node?: VisualHierarchyNode){
    if(!selectedCompTransition || !node) return false;
    if(node.compTransition === selectedCompTransition) return true;
    
    const explodeNode = (n: VisualHierarchyNode): VisualHierarchyNode[] => [n, ...n.innerNodes.flatMap(i => explodeNode(i))];
    
    return explodeNode(node).some(n => n.compTransition === selectedCompTransition);
}

export default HierarchicalNode;