import {
  capitalizeString,
  ComponentOperation,
  CompOpAggCharacteristics,
  OperationType,
  PropertyComponentOperation,
} from 'cdk-change-analyzer-models';
import { EqualityAggModule } from '../../aggregation-module';

export const entityOperationTypeAggModule = new EqualityAggModule(
  CompOpAggCharacteristics.ENTITY_OPERATION_TYPE,
  (cOp: ComponentOperation) => {
    if(cOp instanceof PropertyComponentOperation
            && cOp.propertyOperationType === OperationType.RENAME
            && cOp.pathTransition.v2 && typeof cOp.pathTransition.v2[(cOp.pathTransition.v2?.length ?? 0) - 1] === 'number')
      return 'Value Move'; // rename of number indexes are better described as moves
    return capitalizeString(cOp instanceof PropertyComponentOperation
      ? cOp.propertyOperationType
      : cOp.operationType);
  },
);