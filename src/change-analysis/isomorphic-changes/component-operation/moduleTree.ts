import { CompOpIGCharacteristics } from "change-cd-iac-models/isomorphic-groups";
import { ComponentOperation } from "change-cd-iac-models/model-diffing";
import { IGModuleTreeNode } from "../ig-module-tree-node";
import {
    componentTypeIGModule,
    componentSubtypeIGModule,
    operationTypeIGModule,
    operationEntityIGModule,
    operationCauseIGModule
} from "./ig-modules";
import { dependencyRelationshipSourcePropertyPathV1IGModule, dependencyRelationshipTargetAttributePathV1IGModule, dependencyRelationshipTargetAttributePathV2IGModule } from "./ig-modules/dependency-relationship-paths";
import { entityOperationTypeIGModule } from "./ig-modules/entity-operation-type";
import { propertyPathV1IGModule, propertyPathV2IGModule } from "./ig-modules/property-path";
import { propertyValueV1IGModule, propertyValueV2IGModule } from "./ig-modules/property-value";

const propertyValueSubModules = [{module: propertyValueV1IGModule, disableOnNoExtraInfo: true}, {module: propertyValueV2IGModule, disableOnNoExtraInfo: true}];

const dependencyRelationshipAttributePathSubModules = [{module: dependencyRelationshipTargetAttributePathV2IGModule, disableOnNoExtraInfo: true}, {module: dependencyRelationshipTargetAttributePathV1IGModule, disableOnNoExtraInfo: true}];

export const ComponentOperationIGModuleTree: IGModuleTreeNode<ComponentOperation> = {
    module: componentTypeIGModule,
    forceSubmoduleCollapse: true,
    submodules: [{
        module: componentSubtypeIGModule,
        submodules: [{
            module: operationTypeIGModule,
            disableSubmoduleCollapse: true,
            submodules: [{
                module: operationEntityIGModule,
                forceSubmoduleCollapse: true,
                submodules: [{
                    module: entityOperationTypeIGModule,
                    disableSubmoduleCollapse: true,
                    submodules: [
                        { module: operationCauseIGModule, disableOnNoExtraInfo: true },
                        {
                            module: propertyPathV1IGModule,
                            submodules: propertyValueSubModules,
                            requiredCharacteristics: { [CompOpIGCharacteristics.AFFECTED_ENTITY]: 'Property' }
                        },
                        {
                            module: propertyPathV2IGModule,
                            submodules: propertyValueSubModules,
                            requiredCharacteristics: { [CompOpIGCharacteristics.AFFECTED_ENTITY]: 'Property' }
                        },
                        {
                            module: dependencyRelationshipSourcePropertyPathV1IGModule,
                            submodules: dependencyRelationshipAttributePathSubModules,
                            requiredCharacteristics: { [CompOpIGCharacteristics.AFFECTED_ENTITY]: 'Dependency Relationship' }
                        },
                        {
                            module: dependencyRelationshipSourcePropertyPathV1IGModule,
                            submodules: dependencyRelationshipAttributePathSubModules,
                            requiredCharacteristics: { [CompOpIGCharacteristics.AFFECTED_ENTITY]: 'Dependency Relationship' }
                        }
                    ]
                }],
            }],
        }],
    }]
};

