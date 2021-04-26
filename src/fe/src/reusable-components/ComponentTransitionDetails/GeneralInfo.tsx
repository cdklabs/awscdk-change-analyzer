import { List, ListItem, Typography } from "@material-ui/core";
import { Component } from "change-cd-iac-models/infra-model";
import { ComponentOperation, OutgoingRelationshipComponentOperation, Transition } from "change-cd-iac-models/model-diffing";
import React from "react";
import { useContext } from "react";
import { AppContext } from "../../App";
import { mostRecentInTransition } from "../../selectors/component-transition-helpers";
import { ComponentOperationsList } from "../ComponentOperationsList";
import RelationshipOpDetails from "../RelationshipOpDetails";
import { ComponentDetails } from "./ComponentDetails";

interface Props {
    compTransition: Transition<Component>,
    highlightOperation?: ComponentOperation,
};

export const GeneralInfo = ({compTransition, highlightOperation}: Props) => {
    return <>
        <Typography><b>{mostRecentInTransition(compTransition).type}</b> {mostRecentInTransition(compTransition).subtype ?? ''}</Typography>
        {highlightOperation instanceof OutgoingRelationshipComponentOperation
            ? <RelationshipOpDetails relTransition={highlightOperation.relationshipTransition}/>
            : ''
        }
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