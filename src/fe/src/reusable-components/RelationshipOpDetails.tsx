import React from 'react';
import { ComponentOperation, OutgoingRelationshipComponentOperation, PropertyComponentOperation, Transition } from 'change-cd-iac-models/model-diffing';
import { AppContext } from '../App';
import { getPropertyDiff } from '../selectors/getPropertyDiff';
import { Relationship } from 'change-cd-iac-models/infra-model';
import { Typography } from '@material-ui/core';

interface Props {
    relTransition: Transition<Relationship>
}


function RelationshipOpDetails({relTransition}: Props) {

    return (
        <AppContext.Consumer>{({changeReport}) =>
            <>
                <Typography>
                    <b>Relationship Source:</b> {(relTransition.v2 ?? relTransition.v1!).source.name}
                </Typography>
                <Typography>
                    <b>Relationship Target:</b> {(relTransition.v2 ?? relTransition.v1!).target.name}
                </Typography>
                
            </>
        }</AppContext.Consumer>
    );
}

export default RelationshipOpDetails;