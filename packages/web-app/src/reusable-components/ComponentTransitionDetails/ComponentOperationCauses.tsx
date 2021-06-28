import { List, ListItem, Typography } from "@material-ui/core";
import { ComponentOperation } from "change-analysis-models/model-diffing";
import React from "react";
import { useContext } from "react";
import { AppContext } from "../../App";
import { ComponentOperationsList } from "../ComponentOperationsList";

interface Props {
    op: ComponentOperation,
};

export const ComponentOperationCauses = ({op}: Props) => {

    const { changeReport } = useContext(AppContext); 
    const cause = op.cause;

    const consequences = changeReport.infraModelDiff.componentOperations.filter(o => o.cause === op)

    return <>
        <Typography><b>Caused by:</b> {cause ? <ComponentOperationsList ops={[cause]}/> : 'Direct Change'}</Typography>
        {consequences.length ? <>
            <Typography><b>Consequences:</b></Typography>
            <ComponentOperationsList ops={consequences} />
        </>: ''
            // <Typography>(No known changes result from this change)</Typography>
        }
    </>
}   