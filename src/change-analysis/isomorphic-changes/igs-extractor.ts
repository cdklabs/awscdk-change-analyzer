import { setsEqual } from "change-cd-iac-models/utils";
import { IGModuleTree } from "./ig-module-tree";
import { IsomorphicGroup } from "change-cd-iac-models/isomorphic-groups";

export class ModuleTreeIGsExtractor {

    public static extract<T>(
        moduleTree: IGModuleTree<T>,
        entities: T[],
    ): IsomorphicGroup<T>[] {
        return this.extractTreeRoot(moduleTree, {entities: new Set(entities), characteristics: {}}).flat();
    }

    private static extractTreeRoot<T>(
        moduleTree: IGModuleTree<T>,
        ig: IsomorphicGroup<T>,
    ): [IsomorphicGroup<T>[], IsomorphicGroup<T>[]] {
        const newIGs = moduleTree.map(({module, submodules}): [IsomorphicGroup<T>[], IsomorphicGroup<T>[]] => {
                const directIGs = module.extractGroups([...ig.entities]);
                directIGs.forEach(g => g.characteristics = {...g.characteristics, ...ig.characteristics});

                if(!submodules) return [directIGs, []];

                const innerIGs = directIGs.map(directIG => {
                    return ModuleTreeIGsExtractor.extractTreeRoot<T>(submodules, directIG);
                });

                const [innerDirectIGs, innerSubmoduleIGs] = [innerIGs.flatMap(([i]) => i), innerIGs.flatMap(([,i]) => i)];

                const intersections = ModuleTreeIGsExtractor.findIGsIntersections<T>(innerDirectIGs);

                
                ModuleTreeIGsExtractor.handleDuplicateEntitySets(directIGs, intersections);
                return [directIGs, [...intersections, ...innerSubmoduleIGs]];
            });
             
        return [newIGs.flatMap(([i]) => i), newIGs.flatMap(([,i]) => i)];
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

    private static handleDuplicateEntitySets<T>(directIGs: IsomorphicGroup<T>[], intersectionIGs: IsomorphicGroup<T>[]): void{
        for(let d = directIGs.length-1; d > 0; d--){
            for(let i = intersectionIGs.length-1; i > 0; i--){
                if(setsEqual(directIGs[d].entities, intersectionIGs[i].entities)){
                    const newDirectIG = intersectionIGs.splice(i, 1)[0];
                    directIGs.splice(d, 1);
                    directIGs.push(newDirectIG);
                }
            }
        }
    }

}