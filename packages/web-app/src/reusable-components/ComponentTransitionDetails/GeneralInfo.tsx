import { Typography } from "@material-ui/core";
import { Component } from "cdk-change-analyzer-models/infra-model";
import { ComponentOperation, Transition } from "cdk-change-analyzer-models/model-diffing";
import React from "react";
import { mostRecentInTransition } from "../../selectors/component-transition-helpers";
import { ComponentDetails } from "./ComponentDetails";

interface Props {
    compTransition: Transition<Component>,
    highlightOperation?: ComponentOperation,
};

export const GeneralInfo = ({compTransition, highlightOperation}: Props) => {
    return <>
        <Typography><b>{mostRecentInTransition(compTransition).type}</b> {mostRecentInTransition(compTransition).subtype ?? ''}</Typography>
        <br/>
        {compTransition.v1 ? <>
            <Typography><b>Old Version</b></Typography>
            <ComponentDetails component={compTransition.v1}/>
        </> : ''}
        <br/>
        {compTransition.v2 ? <>
            <Typography><b>New Version</b></Typography>
            <ComponentDetails component={compTransition.v2}/>
        </> : ''}
    </>
}   