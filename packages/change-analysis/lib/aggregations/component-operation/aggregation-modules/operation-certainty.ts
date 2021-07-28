import { ComponentOperation, CompOpAggCharacteristics } from 'cdk-change-analyzer-models';
import { EqualityAggModule } from '../../aggregation-module';

export const operationCertaintyAggModule = new EqualityAggModule(
  CompOpAggCharacteristics.OPERATION_CERTAINTY,
  (cOp: ComponentOperation) => {
    return cOp.certainty;
  },
);