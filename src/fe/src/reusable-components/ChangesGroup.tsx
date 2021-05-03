import { Box, IconButton, Tooltip } from "@material-ui/core";
import { Aggregation } from "change-cd-iac-models/aggregations"
import { ComponentOperation } from "change-cd-iac-models/model-diffing"
import React from "react";
import CollapsableRow from "./CollapsableRow"

import { makeStyles } from '@material-ui/core/styles';
import { Done as DoneIcon, DoneAll as DoneAllIcon } from "@material-ui/icons";
import { useIdAssignerHook } from "../utils/idCreator";
import { AppContext } from "../App";
import ApproveChangeBtn from "./ApproveChangeBtn";

const useStyles = makeStyles({
  content: {
    flexDirection: 'column',
    display: 'flex',
    width: 'calc(100% - 2.5em)',
    marginLeft: '2.5em',
  },
});

interface Props {
    agg: Aggregation<ComponentOperation>,
    title?: React.ReactNode,
    description?: React.ReactNode
}

const ChangesGroup = ({agg, title, description}: Props) => {
    const classes = useStyles();

    const idAssigner = useIdAssignerHook();

    return <AppContext.Consumer>{({selectedAgg, showAggregation}) => 
      <CollapsableRow
        icon={`${agg.entities.size}x`}
        title={title
            ?? agg.descriptions?.filter(d => d).flatMap(d => [(<span key={d}>{d}</span>), (<br/>)]).slice(0, -1)
            ?? Object.entries(agg.characteristics).map(([c, v]) => <span key={c}>{`${c}: `}<b>{v}</b></span>)
        }
        rightIcon={<ApproveChangeBtn changes={[...agg.entities]}/>}
        description={<>{description} {description && '-'} {new Set([...agg.entities].map(e => e.componentTransition)).size} affected</>}
        selected={selectedAgg && selectedAgg === agg}
        onChange={!agg.subAggs ? (() => showAggregation && showAggregation(agg)) : undefined}
        content={agg.subAggs && <Box className={classes.content}>{
          agg.subAggs.map(sg => <ChangesGroup key={idAssigner.get(sg)} agg={sg}/>)
          }</Box>
        }
      />
      }</AppContext.Consumer>
}

export default ChangesGroup;