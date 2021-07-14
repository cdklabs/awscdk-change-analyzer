import { ComponentOperation, CompOpAggCharacteristics } from 'cdk-change-analyzer-models';
import { EqualityAggModule } from '../../aggregation-module';
import { componentSubtypeAggModule } from './component-subtype';
import { componentTypeAggModule } from './component-type';
import { operationEntityAggModule } from './operation-entity';
import { operationTypeAggModule } from './operation-type';

export const operationCauseAggModule = new EqualityAggModule(
  CompOpAggCharacteristics.OPERATION_CAUSE,
  (cOp: ComponentOperation) => {
    return cOp.cause
      ? `Operation ${operationTypeAggModule.indexValueGetter(cOp.cause)} of ${
        operationEntityAggModule.indexValueGetter(cOp.cause)
                ?? componentSubtypeAggModule.indexValueGetter(cOp.cause)
                ?? componentTypeAggModule.indexValueGetter(cOp.cause)
      }`
      : 'Direct Change';
  },
);