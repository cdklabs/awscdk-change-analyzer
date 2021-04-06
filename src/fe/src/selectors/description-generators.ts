import { ChangeAnalysisReport } from "change-cd-iac-models/change-analysis-report";
import { Component } from "change-cd-iac-models/infra-model";
import { InsertComponentOperation, RemoveComponentOperation, RenameComponentOperation, Transition } from "change-cd-iac-models/model-diffing";

export function getComponentOperationsDescription(compTransition: Transition<Component>, changeReport: ChangeAnalysisReport) {
    const ops = changeReport.infraModelDiff.getTransitionOperations(compTransition);
    
    if(!ops.length) return ["Unchanged"];

    return [...new Set(ops.map(o => {
        if(o instanceof InsertComponentOperation)
            return "Inserted"
        if(o instanceof RemoveComponentOperation)
            return "Removed"    
        else if (o instanceof RenameComponentOperation)
            return `Renamed (was ${compTransition.v1!.name})`     
        else return "Updated"
    }))].join(', ');
}