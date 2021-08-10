import { List, ListItem, Typography } from "@material-ui/core";
import { Component, InfraModel } from "@aws-c2a/models/infra-model";
import { OutgoingRelationshipComponentOperation } from "@aws-c2a/models/model-diffing";
import React from "react";
import { getComponentStructuralPath, mostRecentInTransition } from "../../selectors/component-transition-helpers";
import RelationshipOpDetails from "../RelationshipOpDetails";

interface Props {
    component: Component,
};

export const ComponentDetails = ({component}: Props) => {
    return <>
        <Typography>Name: {component.name}</Typography>
        <Typography>Path: {getComponentStructuralPath(component)}</Typography>
    </>
}   