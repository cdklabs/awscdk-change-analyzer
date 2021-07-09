import React, { useContext } from 'react';
import { ComponentOperation, PropertyComponentOperation, Transition } from 'change-analysis-models/model-diffing';
import { AppContext } from '../App';
import { getPropertyDiff } from '../selectors/getPropertyDiff';
import { Component, DependencyRelationship } from 'change-analysis-models/infra-model';
import ChangesDiff from './ChangesDiff';
import { arraysEqual } from 'change-analysis-models';

interface Props {
    componentTransition: Transition<Component>,
    propertyOp?: PropertyComponentOperation,
}


function ComponentPropertyDiff({componentTransition, propertyOp}: Props) {

    const {changeReport} = useContext(AppContext);

    const findLastReferenceInPath = (p: (string | number)[]): Component | undefined => {
        for(let i = p.length; i > 0; i--){
            const path = p.slice(0, i);
            const targetComponent = [...componentTransition.v2?.outgoing ?? [], ...componentTransition.v1?.outgoing ?? []]
                .find(i => i instanceof DependencyRelationship && arraysEqual(i.sourcePropertyPath, path))
                ?.target;
            if(targetComponent)
                return targetComponent;
        }
        return;
    }

    return (
        <AppContext.Consumer>{({showComponentInHierarchy}) =>
            <ChangesDiff
                stringifierOutput={
                    getPropertyDiff({v1: componentTransition.v1?.properties, v2: componentTransition.v2?.properties},
                        changeReport.infraModelDiff.getTransitionOperations(componentTransition)?.filter((o: ComponentOperation) => o instanceof PropertyComponentOperation) as PropertyComponentOperation[]
                    )
                }
                flashObj={propertyOp}
                onClick={(p: (string | number)[]) => {
                    const targetComponent = findLastReferenceInPath(p);
                    if(targetComponent)
                        showComponentInHierarchy(changeReport.infraModelDiff.getComponentTransition(targetComponent));
                }}
                isClickable={(p: (string | number)[]) => {
                    const targetComponent = findLastReferenceInPath(p);
                    return targetComponent !== undefined
                }}/>

        }</AppContext.Consumer>
    );
}

export default ComponentPropertyDiff;