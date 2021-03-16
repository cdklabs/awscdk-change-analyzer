import { Box } from "@material-ui/core";
import { IsomorphicGroup } from "change-cd-iac-models/isomorphic-groups"
import { ComponentOperation } from "change-cd-iac-models/model-diffing"
import React from "react";
import CollapsableRow from "./CollapsableRow"

import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
  root: {
    width: '100%',
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
}

const ChangesGroup = ({ig, title, description}: Props) => {
    const classes = useStyles();

    return <CollapsableRow
        className={classes.root}
        icon={ig.entities.size + 'x'}
        title={title ?? Object.entries(ig.characteristics).map(([c, v]) => <div>{`${c}: `}<b>{v}</b></div>)}
        description={description}
        content={<Box className={classes.content}>{
          ig.subGroups
            ? ig.subGroups.map(sg => <ChangesGroup ig={sg} />)
            : [...ig.entities].map(e => <CollapsableRow icon={'C'} title={e.componentTransition.v2?.name || e.componentTransition.v1?.name || 'Error: Could not find component name'} />)
          }</Box>
        }
    />

}

export default ChangesGroup;