import { CompOpIGCharacteristics } from "change-cd-iac-models/isomorphic-groups";
import { ComponentOperation } from "change-cd-iac-models/model-diffing";
import { IGModuleTreeNode } from "../ig-module-tree";
import {
    componentTypeIGModule,
    componentSubtypeIGModule,
    operationTypeIGModule,
    operationEntityIGModule,
    operationCertaintyIGModule,
    operationCauseIGModule
} from "./ig-modules";
import { entityOperationTypeIGModule } from "./ig-modules/entity-operation-type";
import { propertyPathV1IGModule, propertyPathV2IGModule } from "./ig-modules/property-path";
import { propertyValueV1IGModule, propertyValueV2IGModule } from "./ig-modules/property-value";

const propertyValueSubModules = [{module: propertyValueV1IGModule}, {module: propertyValueV2IGModule}];

export const ComponentOperationIGModuleTree: IGModuleTreeNode<ComponentOperation> = {
    module: componentTypeIGModule,
    submodules: [{
        module: componentSubtypeIGModule,
        submodules: [{
            module: operationTypeIGModule,
            submodules: [{
                module: operationEntityIGModule,
                submodules: [{
                    module: entityOperationTypeIGModule,
                    submodules: [
                        {module: operationCertaintyIGModule},
                        {module: operationCauseIGModule},
                        {
                            module: propertyPathV1IGModule,
                            submodules: propertyValueSubModules,
                            requiredCharacteristics: { [CompOpIGCharacteristics.AFFECTED_ENTITY]: 'Property' }
                        },
                        {
                            module: propertyPathV2IGModule,
                            submodules: propertyValueSubModules,
                            requiredCharacteristics: { [CompOpIGCharacteristics.AFFECTED_ENTITY]: 'Property' }
                        }
                    ]
                }],
            }],
        }],
    }]
};

