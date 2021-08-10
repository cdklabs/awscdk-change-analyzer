import { capitalizeString, ComponentOperation, CompOpAggCharacteristics } from '@aws-c2a/models';
import { EqualityAggModule } from '../../aggregation-module';

export const operationTypeAggModule = new EqualityAggModule(
  CompOpAggCharacteristics.OPERATION_TYPE,
  (cOp: ComponentOperation) => {
    return capitalizeString(cOp.operationType);
  },
);