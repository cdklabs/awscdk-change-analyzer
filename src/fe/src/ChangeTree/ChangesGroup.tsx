import { Box, Typography } from "@material-ui/core";
import { Aggregation } from "change-cd-iac-models/aggregations"
import { ComponentOperation } from "change-cd-iac-models/model-diffing"
import React from "react";
import CollapsableRow from "../reusable-components/CollapsableRow"

import { makeStyles } from '@material-ui/core/styles';
import { AppContext } from '../App';

const useStyles = makeStyles({
  content: {
    flexDirection: 'column',
    display: 'flex',
    width: 'calc(100% - 2.5em)',
    marginLeft: '2.5em',
  },
});

interface Props {
    ig: Aggregation<ComponentOperation>,
    title?: React.ReactNode,
    description?: React.ReactNode
}

const ChangesGroup = ({ig, title, description}: Props) => {
    const classes = useStyles();

    return <AppContext.Consumer>{({selectedAgg, setSelectedAgg}) => 
      <CollapsableRow
        icon={`${ig.entities.size}x`}
        title={title
            ?? ig.descriptions?.map(d => <div>{d}</div>)
            ?? Object.entries(ig.characteristics).map(([c, v]) => <div>{`${c}: `}<b>{v}</b></div>)
        }
        description={<>{description} {description && '-'} {new Set([...ig.entities].map(e => e.componentTransition)).size} affected</>}
        selected={selectedAgg && selectedAgg === ig}
        onChange={!ig.subAggs ? (() => setSelectedAgg && setSelectedAgg(ig)) : undefined}
        content={ig.subAggs && <Box className={classes.content}>{
          ig.subAggs.map(sg => <ChangesGroup ig={sg}/>)
          }</Box>
        }
      />
      }</AppContext.Consumer>
}

export default ChangesGroup;