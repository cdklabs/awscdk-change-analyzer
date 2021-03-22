import { CompOpIGCharacteristics, IGCharacteristicValue } from "change-cd-iac-models/isomorphic-groups";
import { IGModule } from "./ig-module";

type CharacteristicRequirements = { [c in CompOpIGCharacteristics]?: IGCharacteristicValue };

export type IGModuleTreeNode<T> = {
    module: IGModule<T>,
    submodules?: IGModuleTreeNode<T>[],
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
     * By default, the IGs created by module B and its characteristics are always considered,
     * even if module B only creates one IG. However, since 'disableOnNoExtraInfo' is true,
     * if module B does not offer any further grouping (aka has only one resulting IG) it
     * will be discarded, along with its subgroups.
     * 
     */
    disableOnNoExtraInfo?: boolean,

    /**
     * 'disableSubmoduleCollapse' is true if a single IG output of this Node 
     * should be merged with parent module's IG. Note: with disableOnNoExtraInfo
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
     * However, since module B has `disableSubmoduleCollapse: true` associated, module C's IG will not
     * be collapsed and, hence, for the same scenario, there will be groups with characteristics 'a' and 'b',
     * which each have a subgroup with characteristic 'c'.
     * 
     *  
     */
    disableSubmoduleCollapse?: boolean,

    /**
     * 'forceSubmoduleCollapse' is true if a module's resulting IGs should be collapsed with the parent module
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
     * By default, only if there is a single 'b' characteristic value (module B results in a single IGs),
     * will the IG resulting from B be merged with the source IG coming from module A. However, since
     * 'forceSubmoduleCollapse' is true in module A, if there are multiple 'b' characteristic values (module B results
     * in multiple IGs) they will all be collapsed with module A's IGs. The resulting IGs will be as many as
     * the B IGs found and will have both 'b' and 'a' characteristics.
     *  
     */
    forceSubmoduleCollapse?: boolean,
}