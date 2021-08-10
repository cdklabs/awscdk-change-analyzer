import { ComponentOperation, CompOpAggCharacteristics } from '@aws-c2a/models';
import { EqualityAggModule } from '../../aggregation-module';

export const operationCertaintyAggModule = new EqualityAggModule(
  CompOpAggCharacteristics.OPERATION_CERTAINTY,
  (cOp: ComponentOperation) => {
    return cOp.certainty;
  },
);