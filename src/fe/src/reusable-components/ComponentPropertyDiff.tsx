import React from 'react';
import { ComponentOperation, PropertyComponentOperation, Transition } from 'change-cd-iac-models/model-diffing';
import { AppContext } from '../App';
import { getPropertyDiff } from '../selectors/getPropertyDiff';
import { Component } from 'change-cd-iac-models/infra-model';
import ChangesDiff from './ChangesDiff';

interface Props {
    componentTransition: Transition<Component>,
    propertyOp?: PropertyComponentOperation,
}


function ComponentPropertyDiff({componentTransition, propertyOp}: Props) {
    return (
        <AppContext.Consumer>{({changeReport}) =>
            <ChangesDiff
                stringifierOutput={
                    getPropertyDiff({v1: componentTransition.v1?.properties, v2: componentTransition.v2?.properties},
                        changeReport.infraModelDiff.getTransitionOperations(componentTransition)?.filter((o: ComponentOperation) => o instanceof PropertyComponentOperation) as PropertyComponentOperation[]
                    )
                }
                flashObj={propertyOp} />

        }</AppContext.Consumer>
    );
}

export default ComponentPropertyDiff;