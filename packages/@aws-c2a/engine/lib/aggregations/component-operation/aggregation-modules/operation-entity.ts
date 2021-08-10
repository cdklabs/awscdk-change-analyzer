import { ComponentOperation, CompOpAggCharacteristics, PropertyComponentOperation } from '@aws-c2a/models';
import { EqualityAggModule } from '../../aggregation-module';

export const operationEntityAggModule = new EqualityAggModule(
  CompOpAggCharacteristics.AFFECTED_ENTITY,
  (cOp: ComponentOperation) => {
    if(cOp instanceof PropertyComponentOperation) return 'Property';
    return 'Component';
  },
);