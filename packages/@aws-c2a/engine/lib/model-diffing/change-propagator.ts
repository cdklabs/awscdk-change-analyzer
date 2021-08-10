import {
  Component,
  ComponentUpdateType,
  DependencyRelationship,
  ComponentPropertyValue,
  PropertyPath,
  ComponentOperation,
  OperationCertainty,
  RenameComponentOperation,
  ReplaceComponentOperation,
  UpdatePropertyComponentOperation,
  Transition,
  InfraModelDiff,
  TransitionNotFoundError,
  PropertyComponentOperation,
  arraysEqual,
} from '@aws-c2a/models';
import { flatMap } from '../private/node';

/**
 * Creates the ComponentOperations caused by existing ones
 * @returns the new InfraModelDiff
 */
export function propagateChanges(modelDiff: InfraModelDiff): InfraModelDiff{
  const propagatedOperations: ComponentOperation[] = flatMap(modelDiff.componentOperations, o => {
    if(o instanceof UpdatePropertyComponentOperation){
      return propagatePropertyOperation(o, modelDiff);
    } else if(o instanceof RenameComponentOperation){
      return propagateRenameOperation(o, modelDiff);
    }
    return [];
  });
  return new InfraModelDiff(
    [...modelDiff.componentOperations, ...propagatedOperations],
    modelDiff.componentTransitions,
    modelDiff.infraModelTransition,
  );
}

/**
 * Creates the ReplaceComponentOperation for any Component that had a
 * PropertyComponentOperation on a property with UpdateType = REPLACEMENT or POSSIBLE_REPLACEMENT.
 * Creates and recursively propagates the UpdatePropertyComponentOperations for the properties of
 * other Components that depend on this Component.
 * @param compOp the PropertyComponentOperation to be propagated
 * @param modelDiff the original InfraModelDiff
 */
function propagatePropertyOperation(
  compOp: PropertyComponentOperation,
  modelDiff: InfraModelDiff,
): ComponentOperation[] {
  const componentUpdate = compOp.getUpdateType();

  if(componentUpdate !== ComponentUpdateType.REPLACEMENT
        && componentUpdate !== ComponentUpdateType.POSSIBLE_REPLACEMENT)
    return compOp instanceof UpdatePropertyComponentOperation
      ? flatMap((compOp.innerOperations ?? []), i => propagatePropertyOperation(i, modelDiff))
      : [];

  /** if the property is a replacement-inducing collection and
    /* the keys have changed, it should propagate to a replacement
    / */
  if(!compOp.propertyTransition.v1?.isPrimitive()){
    const {v1, v2} = compOp.propertyTransition;
    if(v1 !== undefined
            && v2 !== undefined
            && arraysEqual(Object.keys(v1.getCollection()), Object.keys(v2.getCollection()))
            && compOp instanceof UpdatePropertyComponentOperation
    ){
      return flatMap((compOp.innerOperations ?? []), i => propagatePropertyOperation(i, modelDiff));
    }
  }

  const componentTransition = compOp.componentTransition;

  const replacementOp = new ReplaceComponentOperation({
    certainty: componentUpdate === ComponentUpdateType.POSSIBLE_REPLACEMENT
      ? OperationCertainty.PARTIAL : OperationCertainty.ABSOLUTE,
  }, {
    cause: compOp,
    componentTransition,
  },
  );

  return [replacementOp, ...propagateReplacementOperation(replacementOp, modelDiff)];
}

function propagateRenameOperation(
  compOp: RenameComponentOperation,
  modelDiff: InfraModelDiff,
): ComponentOperation[] {
  const replacementOp = new ReplaceComponentOperation(
    {certainty: OperationCertainty.ABSOLUTE},
    {
      cause: compOp,
      componentTransition: compOp.componentTransition,
    },
  );

  return [replacementOp, ...propagateReplacementOperation(replacementOp, modelDiff)];
}

function propagateReplacementOperation(replacementOp: ReplaceComponentOperation, modelDiff: InfraModelDiff){

  const newComponent = replacementOp.componentTransition.v2;
  if(!newComponent)
    throw Error('ReplaceComponentOperation has no new Component version');

  const dependentRelationships = [...newComponent.incoming]
    .filter(r => r instanceof DependencyRelationship) as DependencyRelationship[];


  const replacementPropagations = flatMap(dependentRelationships, (rel: DependencyRelationship) => {
    try{
      const sourceComponentTransition = modelDiff.getComponentTransition(rel.source);

      const consequentPropertyUpdateOp = createUpdateOperationForComponent(
        modelDiff,
        sourceComponentTransition,
        rel.sourcePropertyPath,
        replacementOp,
      );

      let propagatedPropertyUpdateOp: ComponentOperation[] = [];
      if(consequentPropertyUpdateOp)
        propagatedPropertyUpdateOp = [
          consequentPropertyUpdateOp,
          ...propagatePropertyOperation(consequentPropertyUpdateOp, modelDiff),
        ];

      return propagatedPropertyUpdateOp;
    } catch(e) {
      if(!(e instanceof TransitionNotFoundError)) throw e;
      return [];
    }
  });

  return [...replacementPropagations];
}

/**
 * Creates an UpdatePropertyComponentOperation for a given component, current property path and cause
 * by finding the previous property path and ComponentPropertyValue.
 * @param componentTransition
 * @param v2PropertyPath
 * @param cause
 * @returns
 */
function createUpdateOperationForComponent(
  modelDiff: InfraModelDiff,
  componentTransition: Transition<Component>,
  v2PropertyPath: PropertyPath,
  cause: ComponentOperation,
){
  const [v1PropertyPath, v1Property] = getV1PropertyForComponentTransition(
    modelDiff,
    componentTransition,
    v2PropertyPath,
  );

  //If there was no previous path, it means this value was inserted. No update will be done
  if(!v1PropertyPath) return;

  return new UpdatePropertyComponentOperation(
    {certainty: cause.certainty},
    {
      pathTransition: new Transition({v1: v1PropertyPath, v2: v2PropertyPath}),
      propertyTransition: new Transition({
        v1: v1Property,
        v2: componentTransition.v2?.properties.getPropertyInPath(v2PropertyPath),
      }),
      componentTransition,
      cause,
    },
  );
}

/**
 * Find the previous PropertyPath and ComponentPropertyValue for a current PropertyPath of a ComponentTransition
 * @param componentTransition
 * @param v2PropertyPath
 * @returns [previous PropertyPath, previous ComponentPropertyValue].
 * They can be undefined if the property was inserted
 */
function getV1PropertyForComponentTransition(
  modelDiff: InfraModelDiff,
  componentTransition: Transition<Component>,
  v2PropertyPath: PropertyPath,
): [PropertyPath | undefined, ComponentPropertyValue | undefined] {

  const existingUpdateOperation = modelDiff.getTransitionOperations(componentTransition)
    .find(o => o instanceof UpdatePropertyComponentOperation
      && o.isDirectChange()) as UpdatePropertyComponentOperation | undefined;

  const v1PropertyPath = existingUpdateOperation
    ? existingUpdateOperation.getV1Path(v2PropertyPath)
    : undefined;

  const v1Property = v1PropertyPath
    ? componentTransition.v1?.properties.getPropertyInPath(v1PropertyPath)
    : undefined;

  return [v1PropertyPath, v1Property];
}