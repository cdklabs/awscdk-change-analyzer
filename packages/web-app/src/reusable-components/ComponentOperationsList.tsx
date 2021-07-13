import { List, ListItem, Typography } from "@material-ui/core";
import { Component } from "cdk-change-analyzer-models/infra-model";
import { ComponentOperation, Transition } from "cdk-change-analyzer-models/model-diffing";
import React, { useContext } from "react";
import { AppContext } from "../App";
import { getComponentOperationDescription } from "../selectors/description-generators";

interface Props {
    ops: ComponentOperation[],
};

export const ComponentOperationsList = ({ops}: Props) => {

    const getCompInfo = (ct: Transition<Component>) => {
        const comp = ct.v2 ?? ct.v1
        if(!comp) throw Error('Component Transition has no components');

        return `${comp.type} ${comp.subtype ?? ''} `;
    };

    return <List>
        {ops.map(op => <ListItem><Typography>
            {getCompInfo(op.componentTransition)}
            <br/>{getComponentOperationDescription(op)}
        </Typography></ListItem>)}
    </List>
}