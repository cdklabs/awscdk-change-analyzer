import { setsEqual } from "change-cd-iac-models/utils";
import { IGModuleTreeNode } from "./ig-module-tree";
import { IGCharacteristicValue, IsomorphicGroup } from "change-cd-iac-models/isomorphic-groups";

export class ModuleTreeIGsExtractor {

    public static extract<T>(
        moduleNode: IGModuleTreeNode<T>,
        entities: T[],
    ): IsomorphicGroup<T>[] {
        return this.extractTreeRoot(moduleNode, new Set(entities));
    }

    private static extractTreeRoot<T>(
        moduleNode: IGModuleTreeNode<T>,
        entities: Set<T>,
        characteristics: Record<string, IGCharacteristicValue> = {}
    ): IsomorphicGroup<T>[] {
        if(moduleNode.requiredCharacteristics){
            const isValid = Object.entries(moduleNode.requiredCharacteristics).every(([c, v]) => {
                return characteristics[c] === v;
            });
            if(!isValid) return [];
        }

        const groups = moduleNode.module.extractGroups(entities)
            .map(g => {
                const gs = ModuleTreeIGsExtractor.findIGsIntersections<T>(
                    moduleNode.submodules?.flatMap(
                        sm => ModuleTreeIGsExtractor.extractTreeRoot(sm, g.entities, {...characteristics, ...g.characteristics})
                    ) ?? []
                );

                if(gs.length === 1 && setsEqual(g.entities, gs[0].entities)){
                    return {...gs[0], characteristics: {...g.characteristics, ...gs[0].characteristics} };
                } else if(gs)
                    g.subGroups = gs;
                return g;
            }
        ); 

        return groups;
    }

    private static findIGsIntersections<T>(groups: IsomorphicGroup<T>[]): IsomorphicGroup<T>[]{
        const resultingIntersections: Record<string, IsomorphicGroup<T>> = {};
        const indexGetter = (originalIGs: number[]) => originalIGs.join(',');

        for(let ig = 0; ig < groups.length; ig++){ // for each original IG
            for(const operation of [...groups[ig].entities]){ // each operation in IG
                const igsContainingOperation: number[] = [ig];
                for(let ig2 = ig+1; ig2 < groups.length; ig2++){ // check all other original IGs for same operation
                    if(groups[ig2].entities.has(operation)){
                        igsContainingOperation.push(ig2); // add it to the intersection identifier
                        groups[ig2].entities.delete(operation);
                    }
                }
                if(igsContainingOperation.length > 1){
                    const intersectionIndex = indexGetter(igsContainingOperation);
                    if(!resultingIntersections[intersectionIndex]){
                        resultingIntersections[intersectionIndex] = {
                            entities: new Set([operation]),
                            characteristics: Object.assign({}, ...igsContainingOperation.map(i => groups[i].characteristics))
                        };
                    } else {
                        resultingIntersections[intersectionIndex].entities.add(operation);
                    } 
                    groups[ig].entities.delete(operation);
                }
            }
        }
        return [...groups, ...Object.values(resultingIntersections)].filter(ig => ig.entities.size > 0);
    }
}