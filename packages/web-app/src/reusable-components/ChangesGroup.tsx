import { Box, IconButton, Tooltip } from "@material-ui/core";
import { Aggregation } from "change-analysis-models/aggregations"
import { ComponentOperation } from "change-analysis-models/model-diffing"
import React, { useContext, useEffect, useRef, useState } from "react";
import CollapsableRow from "./CollapsableRow"

import { makeStyles } from '@material-ui/core/styles';
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
    description?: React.ReactNode,
    expandedByDefault?: boolean
}

const ChangesGroup = ({agg, title, description, expandedByDefault}: Props) => {
    const classes = useStyles();

    const { selectedAgg } = useContext(AppContext);
    const [isExpanded, setExpanded] = useState(false);

    const ref = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        setExpanded(isAggExpanded(selectedAgg, agg, expandedByDefault));
        if(agg === selectedAgg && ref.current?.scrollIntoView){
            ref.current?.scrollIntoView({block: 'end', behavior: 'smooth'});
        }
    }, [selectedAgg]);

    const idAssigner = useIdAssignerHook();

    return <AppContext.Consumer>{({showAggregation}) => 
      <CollapsableRow
        icon={`${agg.entities.size}x`}
        title={title
            ?? agg.descriptions?.filter(d => d).flatMap((d,i) => [<span key={d}>{d}</span>, <br key={i}/>]).slice(0, -1)
            ?? Object.entries(agg.characteristics).map(([c, v]) => <span key={c}>{`${c}: `}<b>{v}</b></span>)
        }
        rightIcon={<ApproveChangeBtn changes={[...agg.entities]}/>}
        description={<>
          {description}{description && ' - '}{new Set([...agg.entities].map(e => <React.Fragment key={e.nodeData._id}>{e.componentTransition}</React.Fragment>)).size} affected</>}
        selected={selectedAgg && selectedAgg === agg}
        onChange={!agg.subAggs ? (() => showAggregation && showAggregation(agg)) : undefined}
        content={agg.subAggs && <Box className={classes.content}>{
          agg.subAggs.map(sg => <ChangesGroup key={idAssigner.get(sg)} agg={sg} expandedByDefault={agg.subAggs?.length === 1}/>)
          }</Box>
        }
        expanded={isExpanded}
      />
      }</AppContext.Consumer>
}

function isAggExpanded(selectedAgg?: Aggregation<ComponentOperation>, agg?: Aggregation<ComponentOperation>, expandedByDefault: boolean = false){
  if(expandedByDefault) return true;
  if(!selectedAgg || !agg) return false;
  if(agg === selectedAgg) return true;
  
  const explodeAgg = (n: Aggregation<ComponentOperation>): Aggregation<ComponentOperation>[] => [n, ...n.subAggs?.flatMap(i => explodeAgg(i)) ?? []];
  
  return explodeAgg(agg).some(a => a === selectedAgg);
}

export default ChangesGroup;