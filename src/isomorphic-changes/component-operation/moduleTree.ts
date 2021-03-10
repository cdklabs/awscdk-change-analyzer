import { ComponentOperation } from "../../model-diffing";
import { IGModuleTree } from "../ig-module-tree";
import {
    componentTypeIGModule,
    componentSubtypeIGModule,
    operationTypeIGModule,
    operationEntityIGModule,
    operationCertaintyIGModule,
    operationCauseIGModule
} from "./ig-modules";
import { propertyPathV1IGModule, propertyPathV2IGModule } from "./ig-modules/property-path";
import { propertyValueV1IGModule, propertyValueV2IGModule } from "./ig-modules/property-value";

const propertyValueSubModules = [{module: propertyValueV1IGModule}, {module: propertyValueV2IGModule}];

export const ComponentOperationIGModuleTree: IGModuleTree<ComponentOperation> = [
    {
        module: operationEntityIGModule,
        submodules: [{
            module: operationTypeIGModule,
            submodules: [{
                module: componentTypeIGModule,
                submodules: [{
                    module: componentSubtypeIGModule,
                    submodules: [
                        {module: operationCertaintyIGModule},
                        {module: operationCauseIGModule},
                        {
                            module: propertyPathV1IGModule,
                            submodules: propertyValueSubModules,
                        },
                        {
                            module: propertyPathV2IGModule,
                            submodules: propertyValueSubModules,
                        }
                    ]
                }],
            }],
        }]
    }
];

