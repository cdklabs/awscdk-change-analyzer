import { Box } from "@material-ui/core";
import { IsomorphicGroup } from "change-cd-iac-models/isomorphic-groups"
import { ComponentOperation } from "change-cd-iac-models/model-diffing"
import React from "react";
import CollapsableRow from "./CollapsableRow"

import { makeStyles } from '@material-ui/core/styles';
import { groupArrayBy } from "change-cd-iac-models/utils";

const useStyles = makeStyles({
  root: {
    width: '100%'
  },
  content: {
    flexDirection: 'column',
    display: 'flex',
    width: 'calc(100% - 2.5em)',
    marginLeft: '2.5em',
  },
});

interface Props {
    ig: IsomorphicGroup<ComponentOperation>,
    title?: React.ReactNode,
    description?: React.ReactNode,
    setSelectedIG?: Function,
    selectedIG?: IsomorphicGroup<ComponentOperation>
}

const ChangesGroup = ({ig, title, description, setSelectedIG, selectedIG}: Props) => {
    const classes = useStyles();

    return <CollapsableRow
        className={classes.root}
        icon={ig.entities.size + 'x'}
        title={title ?? ig.descriptions?.map(d => <div>{d}</div>) ?? Object.entries(ig.characteristics).map(([c, v]) => <div>{`${c}: `}<b>{v}</b></div>)}
        description={description}
        selected={selectedIG && selectedIG === ig}
        onChange={!ig.subGroups ? (() => setSelectedIG && setSelectedIG(ig)) : undefined}
        content={ig.subGroups && <Box className={classes.content}>{
          ig.subGroups.map(sg => <ChangesGroup ig={sg} setSelectedIG={setSelectedIG} selectedIG={selectedIG} />)
          }</Box>
        }
    />
}

export default ChangesGroup;