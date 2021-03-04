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
    UpdatePropertiesComponentOperation,
    UpdatePropertyOperation,
    OperationCertainty,
    ReplaceComponentOperation
} from "./operations";
import { Transition } from "./transition";

export class ChangePropagator {
    
    private readonly propagatedOperations: ComponentOperation[] = [];

    constructor(
        private readonly modelDiff: InfraModelDiff,
    ){}

    propagate(): InfraModelDiff{
        this.modelDiff.componentOperations.forEach(o => {
                if(o instanceof UpdatePropertiesComponentOperation){   
                    this.propagatePropertyUpdate(o.componentTransition, o);
                }
        });
        return new InfraModelDiff(
            [...this.modelDiff.componentOperations, ...this.propagatedOperations],
            this.modelDiff.componentTransitions
        );
    }

    private propagatePropertyUpdate(
        componentTransition: Transition<Component>,
        compOp: UpdatePropertiesComponentOperation
    ) {
        const componentUpdate = compOp.operation.getUpdateType();
        if(componentUpdate !== ComponentUpdateType.REPLACEMENT
            && componentUpdate !== ComponentUpdateType.POSSIBLE_REPLACEMENT)
            return;
        
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
            this.propagatePropertyUpdate(sourceComponentTransition, consequentPropertyUpdateOp);
        });
    }

    private createUpdateOperationForComponent(
        componentTransition: Transition<Component>,
        v2PropertyPath: PropertyPath,
        cause: ComponentOperation
    ){
        const [v1PropertyPath, v1Property] = this.getV1PropertyForComponentTransition(componentTransition, v2PropertyPath);

        return new UpdatePropertiesComponentOperation(
            componentTransition,
            new UpdatePropertyOperation(
                {v1: v1PropertyPath, v2: v2PropertyPath},
                {
                    v1: v1Property,
                    v2: componentTransition.v2?.properties.getPropertyInPath(v2PropertyPath)
                }
            ),
            {certainty: cause.certainty, cause}
        );
    }

    private getV1PropertyForComponentTransition(
        componentTransition: Transition<Component>,
        v2PropertyPath: PropertyPath
    ): [PropertyPath | undefined, ComponentProperty | undefined] {

        const existingUpdateOperation = this.modelDiff.getTransitionOperations(componentTransition)
            .find(o => o instanceof UpdatePropertiesComponentOperation && o.isDirectChange()) as UpdatePropertiesComponentOperation | undefined;
        
        const v1PropertyPath = existingUpdateOperation
            ? existingUpdateOperation.operation.getV1Path(v2PropertyPath)
            : undefined;
        
        const v1Property = v1PropertyPath
            ? componentTransition.v1?.properties.getPropertyInPath(v1PropertyPath)
            : undefined;
        
        return [v1PropertyPath, v1Property];
    }
}