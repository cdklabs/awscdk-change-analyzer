import { AggCharacteristicValue, Aggregation } from 'cdk-change-analyzer-models';
import { flatMap } from '../private/node';

export type AggDescriptionCreator =
    (characteristics: Record<string, AggCharacteristicValue>) => {
      describedCharacteristics?: string[],
      descriptions?: string[]
    };

export function addAggDescriptions<T>(
  aggRoots: Aggregation<T>[], descriptionCreators: AggDescriptionCreator[],
): Aggregation<T>[]{
  const aggStack: Aggregation<T>[] = [...aggRoots];

  while(aggStack.length){
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const agg = aggStack.pop()!;
    aggStack.push(...agg?.subAggs ?? []);
    if(!agg.descriptions)
      agg.descriptions = [];
    const undescribedCharacteristics = new Set(Object.keys(agg.characteristics));
    agg.descriptions.push(...flatMap(descriptionCreators, creator => {
      const { descriptions, describedCharacteristics } = creator(agg.characteristics);
      describedCharacteristics?.forEach(c => undescribedCharacteristics.delete(c));
      return descriptions ?? [];
    }));

    agg.descriptions.push(...[...undescribedCharacteristics].map(c => `${c}: ${agg.characteristics[c]}`));
  }

  return aggRoots;
}