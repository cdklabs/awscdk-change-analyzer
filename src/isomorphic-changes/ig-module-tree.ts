import { IGModule } from "./ig-module";

export type IGModuleTreeNode<T> = {
    module: IGModule<T>,
    submodules?: IGModuleTree<T>
}

export type IGModuleTree<T> = IGModuleTreeNode<T>[];