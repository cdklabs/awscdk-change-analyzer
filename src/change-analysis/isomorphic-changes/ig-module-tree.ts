import { CompOpIGCharacteristics, IGCharacteristicValue } from "change-cd-iac-models/isomorphic-groups";
import { IGModule } from "./ig-module";

type CharacteristicRequirements = { [c in CompOpIGCharacteristics]?: IGCharacteristicValue };


export type IGModuleTreeNode<T> = {
    module: IGModule<T>,
    submodules?: IGModuleTreeNode<T>[],
    requiredCharacteristics?: CharacteristicRequirements
}