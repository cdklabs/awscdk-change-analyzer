import { AggCharacteristicValue, Aggregation, setsEqual } from 'cdk-change-analyzer-models';
import { flatMap } from '../private/node';
import { AggModuleTreeNode } from './aggregation-module-tree-node';

export class ModuleTreeAggsExtractor {

  public static extract<T>(
    moduleNode: AggModuleTreeNode<T>,
    entities: T[],
  ): Aggregation<T>[] {
    return this.extractTreeRoot(moduleNode, new Set(entities));
  }

  private static extractTreeRoot<T>(
    moduleNode: AggModuleTreeNode<T>,
    entities: Set<T>,
    characteristics: Record<string, AggCharacteristicValue> = {},
  ): Aggregation<T>[] {
    if(moduleNode.requiredCharacteristics){
      const isValid = Object.entries(moduleNode.requiredCharacteristics).every(([c, v]) => {
        return characteristics[c] === v;
      });
      if(!isValid) return [];
    }

    const directAggs = moduleNode.module.extractGroups(entities);

    if(moduleNode.disableOnNoExtraInfo && directAggs.length <= 1)
      return [];

    const finalAggs = flatMap(directAggs, g => {
      const gs = ModuleTreeAggsExtractor.findAggsIntersections<T>(
        moduleNode.submodules ? flatMap(moduleNode.submodules,
          sm => ModuleTreeAggsExtractor.extractTreeRoot(sm, g.entities, {...characteristics, ...g.characteristics}),
        ) : [],
      );

      if(moduleNode.forceSubmoduleCollapse ||
        (!moduleNode.disableSubmoduleCollapse && gs.length === 1&& setsEqual(g.entities, gs[0].entities))) {
        return gs.map(gSubGroup =>
          ({
            ...gSubGroup,
            characteristics: {...g.characteristics, ...gSubGroup.characteristics},
          }),
        );
      } else if(gs && gs.length) {
        g.subAggs = gs;
        gs.forEach(gSubGroup => gSubGroup.parentAgg = g);
      }

      return [g];
    },
    );

    return finalAggs;
  }

  private static findAggsIntersections<T>(groups: Aggregation<T>[]): Aggregation<T>[]{
    const resultingIntersections: Record<string, Aggregation<T>> = {};
    const indexGetter = (originalAggs: number[]) => originalAggs.join(',');

    for(let agg = 0; agg< groups.length; agg++){ // for each original Agg
      for(const operation of [...groups[agg].entities]){ // each operation in Agg
        const aggsContainingOperation: number[] = [agg];
        for(let agg2 = agg+1; agg2 < groups.length; agg2++){ // check all other original Aggs for same operation
          if(groups[agg2].entities.has(operation)){
            aggsContainingOperation.push(agg2); // add it to the intersection identifier
            groups[agg2].entities.delete(operation);
          }
        }
        if(aggsContainingOperation.length > 1){
          const intersectionIndex = indexGetter(aggsContainingOperation);
          if(!resultingIntersections[intersectionIndex]){
            resultingIntersections[intersectionIndex] = {
              entities: new Set([operation]),
              characteristics: Object.assign({}, ...aggsContainingOperation.map(i => groups[i].characteristics)),
            };
          } else {
            resultingIntersections[intersectionIndex].entities.add(operation);
          }
          groups[agg].entities.delete(operation);
        }
      }
    }
    return [...groups, ...Object.values(resultingIntersections)].filter(agg => agg.entities.size > 0);
  }
}