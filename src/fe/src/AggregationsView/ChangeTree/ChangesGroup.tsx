import { Box, IconButton, Tooltip } from "@material-ui/core";
import { Aggregation } from "change-cd-iac-models/aggregations"
import { ComponentOperation } from "change-cd-iac-models/model-diffing"
import React from "react";
import CollapsableRow from "../../reusable-components/CollapsableRow"

import { makeStyles } from '@material-ui/core/styles';
import { AggregationsContext } from '../AggregationsTab';
import { Done as DoneIcon, DoneAll as DoneAllIcon } from "@material-ui/icons";
import { useIdAssignerHook } from "../../utils/idCreator";

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

    const idAssigner = useIdAssignerHook();

    return <AggregationsContext.Consumer>{({selectedAgg, setSelectedAgg}) => 
      <CollapsableRow
        icon={`${ig.entities.size}x`}
        title={title
            ?? ig.descriptions?.map(d => <span key={d}>{d}</span>)
            ?? Object.entries(ig.characteristics).map(([c, v]) => <span key={c}>{`${c}: `}<b>{v}</b></span>)
        }
        rightIcon={<Tooltip title={`Approve ${ig.subAggs ? 'these changes' : 'this change'}`}><IconButton size="small">{ig.subAggs ? <DoneAllIcon/> : <DoneIcon/>}</IconButton></Tooltip>}
        description={<>{description} {description && '-'} {new Set([...ig.entities].map(e => e.componentTransition)).size} affected</>}
        selected={selectedAgg && selectedAgg === ig}
        onChange={!ig.subAggs ? (() => setSelectedAgg && setSelectedAgg(ig)) : undefined}
        content={ig.subAggs && <Box className={classes.content}>{
          ig.subAggs.map(sg => <ChangesGroup key={idAssigner.get(sg)} ig={sg}/>)
          }</Box>
        }
      />
      }</AggregationsContext.Consumer>
}

export default ChangesGroup;