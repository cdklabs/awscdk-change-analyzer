import {
    Component,
    ComponentUpdateType,
    DependencyRelationship,
    ComponentProperty,
    PropertyPath,
} from "../infra-model";
import { InfraModelDiff } from "./infra-model-diff";
import { 
    ComponentOperation,
    OperationCertainty,
    ReplaceComponentOperation,
    UpdatePropertyComponentOperation
} from "./operations";
import { Transition } from "./transition";

/**
 * Creates the ComponentOperations caused by existing ones
 * using the propagate method and returns the new InfraModelDiff
 */
export class ChangePropagator {
    
    private readonly propagatedOperations: ComponentOperation[] = [];

    constructor(
        private readonly modelDiff: InfraModelDiff,
    ){}

    /**
     * Performs the propagation of InfraModelDiff's changes
     * @returns the new InfraModelDiff
     */
    propagate(): InfraModelDiff{
        this.modelDiff.componentOperations.forEach(o => {
                if(o instanceof UpdatePropertyComponentOperation){   
                    this.propagatePropertyOperation(o);
                }
        });
        return new InfraModelDiff(
            [...this.modelDiff.componentOperations, ...this.propagatedOperations],
            this.modelDiff.componentTransitions
        );
    }

    /**
     * Creates the ReplaceComponentOperation for any Component that had a
     * PropertyComponentOperation on a property with UpdateType = REPLACEMENT or POSSIBLE_REPLACEMENT.
     * Creates and recursively propagates the UpdatePropertyComponentOperations for the properties of
     * other Components that depend on this Component.
     * @param compOp the PropertyComponentOperation to be propagated
     */
    private propagatePropertyOperation(
        compOp: UpdatePropertyComponentOperation
    ) {
        const componentUpdate = compOp.getUpdateType();
        if(componentUpdate !== ComponentUpdateType.REPLACEMENT
            && componentUpdate !== ComponentUpdateType.POSSIBLE_REPLACEMENT)
            return;
            
        const componentTransition = compOp.componentTransition;
        const replacementOp = new ReplaceComponentOperation(componentTransition, {
            cause: compOp,
            certainty: componentUpdate === ComponentUpdateType.POSSIBLE_REPLACEMENT
                    ? OperationCertainty.PARTIAL : OperationCertainty.ABSOLUTE,
        });

        this.propagatedOperations.push(replacementOp);

        const newComponent = compOp.componentTransition.v2;
        if(!newComponent)
            throw Error("UpdatePropertyComponentOperation has no new Component version");
        
        const dependentRelationships = [...newComponent.incoming]
            .filter(r => r instanceof DependencyRelationship) as DependencyRelationship[];

            
        dependentRelationships.forEach((rel: DependencyRelationship) => {
            const sourceComponentTransition = this.modelDiff.getComponentTransition(rel.source);
            
            const consequentPropertyUpdateOp = this.createUpdateOperationForComponent(sourceComponentTransition, rel.sourcePropertyPath, replacementOp);
            this.propagatedOperations.push(consequentPropertyUpdateOp);
            this.propagatePropertyOperation(consequentPropertyUpdateOp);
        });
    }

    /**
     * Creates an UpdatePropertyComponentOperation for a given component, current property path and cause
     * by finding the previous property path and ComponentProperty.
     * @param componentTransition 
     * @param v2PropertyPath 
     * @param cause 
     * @returns 
     */
    private createUpdateOperationForComponent(
        componentTransition: Transition<Component>,
        v2PropertyPath: PropertyPath,
        cause: ComponentOperation
    ){
        const [v1PropertyPath, v1Property] = this.getV1PropertyForComponentTransition(componentTransition, v2PropertyPath);

        return new UpdatePropertyComponentOperation(
            {v1: v1PropertyPath, v2: v2PropertyPath},
            {
                v1: v1Property,
                v2: componentTransition.v2?.properties.getPropertyInPath(v2PropertyPath)
            },
            componentTransition,
            {certainty: cause.certainty, cause}
        );
    }

    /**
     * Find the previous PropertyPath and ComponentProperty for a current PropertyPath of a ComponentTransition
     * @param componentTransition 
     * @param v2PropertyPath 
     * @returns [previous PropertyPath, previous ComponentProperty].
     * They can be undefined if the property was inserted
     */
    private getV1PropertyForComponentTransition(
        componentTransition: Transition<Component>,
        v2PropertyPath: PropertyPath
    ): [PropertyPath | undefined, ComponentProperty | undefined] {

        const existingUpdateOperation = this.modelDiff.getTransitionOperations(componentTransition)
            .find(o => o instanceof UpdatePropertyComponentOperation && o.isDirectChange()) as UpdatePropertyComponentOperation | undefined;
        
        const v1PropertyPath = existingUpdateOperation
            ? existingUpdateOperation.getV1Path(v2PropertyPath)
            : undefined;
        
        const v1Property = v1PropertyPath
            ? componentTransition.v1?.properties.getPropertyInPath(v1PropertyPath)
            : undefined;
        
        return [v1PropertyPath, v1Property];
    }
}