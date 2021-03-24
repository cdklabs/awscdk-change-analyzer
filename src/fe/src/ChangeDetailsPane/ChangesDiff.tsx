import React from 'react';
import { ComponentOperation, PropertyComponentOperation } from 'change-cd-iac-models/model-diffing';
import { Typography } from '@material-ui/core';

interface props {
    operation: ComponentOperation,
}

function ChangesDiff({operation}: props) {
    return (
            <Typography>
                <pre>
                    {JSON.stringify(
                        operation instanceof PropertyComponentOperation
                        ? {'Property Path': operation.pathTransition, 'Property Value': operation.propertyTransition}
                        : operation.componentTransition, null, 4)}
                </pre>
            </Typography>         
    );
}
export default ChangesDiff;