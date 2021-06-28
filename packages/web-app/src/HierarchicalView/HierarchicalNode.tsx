import React, { useContext, useEffect, useRef, useState } from 'react';
import CollapsableRow from '../reusable-components/CollapsableRow';
import { Badge, List } from '@material-ui/core';

import UpdateIcon from '@material-ui/icons/Update';
import { VisualHierarchyNode } from '../selectors/hierarchy-builder';
import { AppContext } from '../App';
import { Transition } from 'change-analysis-models/model-diffing';
import { Component } from 'change-analysis-models/infra-model';
import ApproveChangeBtn from '../reusable-components/ApproveChangeBtn';

interface Props {
    node: VisualHierarchyNode,
    expandedByDefault?: boolean
}

function HierarchicalNode({node, expandedByDefault}: Props) {

    const {changes, compTransition, innerNodes} = node;

    const {selectedCompTransition} = useContext(AppContext);
    const [isExpanded, setExpanded] = useState(false);

    const ref = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        setExpanded(isNodeExpanded(selectedCompTransition, node, expandedByDefault));
        if(node.compTransition === selectedCompTransition && ref.current?.scrollIntoView){
            ref.current?.scrollIntoView({block: 'end', behavior: 'smooth'});
        }
    }, [selectedCompTransition]);


    return (
        <AppContext.Consumer>{({setSelectedCompTransition}) =>
            <CollapsableRow
                ref={ref}
                icon={<Badge badgeContent={changes.length} color="secondary"><UpdateIcon/></Badge>}
                title={compTransition.v2?.name || compTransition.v1?.name}
                rightIcon={<ApproveChangeBtn changes={changes} />}
                description={`${compTransition.v2?.type || compTransition.v1?.type} ${compTransition.v2?.subtype ?? compTransition.v1?.subtype ?? ''}`}
                content={innerNodes.length > 0 ?
                    <List disablePadding style={{marginLeft: '2.5em', width: 'calc(100% - 2.5em)'}}>
                        {innerNodes.map(n => <HierarchicalNode key={n.compTransition.nodeData._id} node={n} expandedByDefault={innerNodes.length === 1}/>)}
                    </List>
                    : undefined}
                selected={selectedCompTransition === compTransition}
                onChange={(ev, e) => (setExpanded(e), e && (setSelectedCompTransition(compTransition)))}
                expanded={isExpanded}
            />
        }</AppContext.Consumer>
    );
}

function isNodeExpanded(selectedCompTransition?: Transition<Component>, node?: VisualHierarchyNode, expandedByDefault: boolean = false){
    if(expandedByDefault) return true;
    if(!selectedCompTransition || !node) return false;
    if(node.compTransition === selectedCompTransition) return true;
    
    const explodeNode = (n: VisualHierarchyNode): VisualHierarchyNode[] => [n, ...n.innerNodes.flatMap(i => explodeNode(i))];
    
    return explodeNode(node).some(n => n.compTransition === selectedCompTransition);
}

export default HierarchicalNode;