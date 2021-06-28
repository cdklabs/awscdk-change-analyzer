import React from 'react';
import { ComponentOperation, PropertyComponentOperation, Transition } from 'change-cd-iac-models/model-diffing';
import { AppContext } from '../App';
import { getPropertyDiff } from '../selectors/getPropertyDiff';
import { Component, DependencyRelationship } from 'change-cd-iac-models/infra-model';
import ChangesDiff from './ChangesDiff';
import { arraysEqual, isDefined } from 'change-cd-iac-models/utils';

interface Props {
    componentTransition: Transition<Component>,
    propertyOp?: PropertyComponentOperation,
}


function ComponentPropertyDiff({componentTransition, propertyOp}: Props) {
    return (
        <AppContext.Consumer>{({changeReport, showComponentInHierarchy}) =>
            <ChangesDiff
                stringifierOutput={
                    getPropertyDiff({v1: componentTransition.v1?.properties, v2: componentTransition.v2?.properties},
                        changeReport.infraModelDiff.getTransitionOperations(componentTransition)?.filter((o: ComponentOperation) => o instanceof PropertyComponentOperation) as PropertyComponentOperation[]
                    )
                }
                flashObj={propertyOp}
                onClick={(p: (string | number)[]) => {
                    // check if there's a reference in this path. If so, navigate to it
                    for(let i = p.length; i > 0; i--){
                        const path = p.slice(0, i);
                        const targetComponent = [...componentTransition.v2?.outgoing ?? [], ...componentTransition.v1?.outgoing ?? []]
                            .find(i => i instanceof DependencyRelationship && arraysEqual(i.sourcePropertyPath, path))
                            ?.target;
                        if(targetComponent) {
                            showComponentInHierarchy(changeReport.infraModelDiff.getComponentTransition(targetComponent));
                            return;
                        }
                    }
                }}/>

        }</AppContext.Consumer>
    );
}

export default ComponentPropertyDiff;