import { CompOpAggCharacteristics, AggCharacteristicValue } from "change-analysis-models";
import { AggModule } from "./aggregation-module";

type CharacteristicRequirements = { [c in CompOpAggCharacteristics]?: AggCharacteristicValue };

export type AggModuleTreeNode<T> = {
    module: AggModule<T>,
    submodules?: AggModuleTreeNode<T>[],
    requiredCharacteristics?: CharacteristicRequirements,

    /**
     * 'disableOnNoExtraInfo' is true if the module should be used
     * only when it offers detailing information. 
     *
     * For example, for a TreeNode such as the following:
     * {
     *      module: A (this module groups entities by characteristic 'a'),
     *      submodules: [{
     *          module: B (this module groups entities by characteristic 'b'),
     *          disableOnNoExtraInfo: true
     *      }]
     * }
     * By default, the Aggregations created by module B and its characteristics are always considered,
     * even if module B only creates one Aggregation. However, since 'disableOnNoExtraInfo' is true,
     * if module B does not offer any further grouping (aka has only one resulting Aggregation) it
     * will be discarded, along with its subgroups.
     * 
     */
    disableOnNoExtraInfo?: boolean,

    /**
     * 'disableSubmoduleCollapse' is true if a single Aggregation output of this Node 
     * should be merged with parent module's Aggregation. Note: with disableOnNoExtraInfo
     * 
     * For example, for a TreeNode such as the following:
     * {
     *      module: A (this module groups entities by characteristic 'a'),
     *      submodules: [{
     *          module: B (this module groups entities by characteristic 'b'),
     *          disableSubmoduleCollapse: true
     *          submodules: [{
     *              module: C (this module groups entities by characteristic 'c')
     *          }]
     *      }]
     * }
     * By default, if the modules B and C do not split the groups resulting from A, they will be merged
     * together onto groups with characteristics 'a', 'b' and 'c'.
     * However, since module B has `disableSubmoduleCollapse: true` associated, module C's Aggregation will not
     * be collapsed and, hence, for the same scenario, there will be groups with characteristics 'a' and 'b',
     * which each have a subgroup with characteristic 'c'.
     * 
     *  
     */
    disableSubmoduleCollapse?: boolean,

    /**
     * 'forceSubmoduleCollapse' is true if a module's resulting Aggregations should be collapsed with the parent module
     * 
     * For example, for a TreeNode such as the following:
     * {
     *      module: A (this module groups entities by characteristic 'a'),
     *      forceSubmoduleCollapse: true,
     *      submodules: [{
     *          module: B (this module groups entities by characteristic 'b'),
     *          
     *      }]
     * }
     * By default, only if there is a single 'b' characteristic value (module B results in a single Aggregations),
     * will the Aggregation resulting from B be merged with the source Aggregation coming from module A. However, since
     * 'forceSubmoduleCollapse' is true in module A, if there are multiple 'b' characteristic values (module B results
     * in multiple Aggregations) they will all be collapsed with module A's Aggregations. The resulting Aggregations will be as many as
     * the B Aggregations found and will have both 'b' and 'a' characteristics.
     *  
     */
    forceSubmoduleCollapse?: boolean,
}