import { ChangeAnalysisReport } from "change-analysis-models/change-analysis-report";
import { Component } from "change-analysis-models/infra-model";
import { ComponentOperation, InsertComponentOperation, RemoveComponentOperation, RenameComponentOperation, Transition } from "change-analysis-models/model-diffing";

export function getComponentOperationsDescription(compTransition: Transition<Component>, changeReport: ChangeAnalysisReport) {
    const ops = changeReport.infraModelDiff.getTransitionOperations(compTransition);
    
    if(!ops.length) return ["Unchanged"];

    return [...new Set(ops.map(getComponentOperationDescription))].join(', ');
}

export function getComponentOperationDescription(o: ComponentOperation){
    if(o instanceof InsertComponentOperation)
        return "Inserted"
    if(o instanceof RemoveComponentOperation)
        return "Removed"    
    else if (o instanceof RenameComponentOperation)
        return `Renamed (was ${o.componentTransition.v1!.name})`     
    else return "Updated"
}