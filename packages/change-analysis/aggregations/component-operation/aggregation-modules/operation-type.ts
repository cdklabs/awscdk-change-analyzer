import { capitalizeString, ComponentOperation, CompOpAggCharacteristics } from 'cdk-change-analyzer-models';
import { EqualityAggModule } from '../../aggregation-module';

export const operationTypeAggModule = new EqualityAggModule(
  CompOpAggCharacteristics.OPERATION_TYPE,
  (cOp: ComponentOperation) => {
    return capitalizeString(cOp.operationType);
  },
);