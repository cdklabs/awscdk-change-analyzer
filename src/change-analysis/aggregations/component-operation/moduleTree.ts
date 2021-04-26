import { CompOpAggCharacteristics } from "change-cd-iac-models/aggregations";
import { ComponentOperation } from "change-cd-iac-models/model-diffing";
import { AggModuleTreeNode } from "../aggregation-module-tree-node";
import {
    componentTypeAggModule,
    componentSubtypeAggModule,
    operationTypeAggModule,
    operationEntityAggModule,
    operationCauseAggModule
} from "./aggregation-modules";
import { dependencyRelationshipSourcePropertyPathV1AggModule, dependencyRelationshipTargetAttributePathV1AggModule, dependencyRelationshipTargetAttributePathV2AggModule } from "./aggregation-modules/dependency-relationship-paths";
import { entityOperationTypeAggModule } from "./aggregation-modules/entity-operation-type";
import { propertyPathV1AggModule, propertyPathV2AggModule } from "./aggregation-modules/property-path";
import { propertyValueV1AggModule, propertyValueV2AggModule } from "./aggregation-modules/property-value";

const propertyValueSubModules = [{module: propertyValueV1AggModule, disableOnNoExtraInfo: true}, {module: propertyValueV2AggModule, disableOnNoExtraInfo: true}];

const dependencyRelationshipAttributePathSubModules = [{module: dependencyRelationshipTargetAttributePathV2AggModule, disableOnNoExtraInfo: true}, {module: dependencyRelationshipTargetAttributePathV1AggModule, disableOnNoExtraInfo: true}];

export const componentOperationSpecificAggModuleTree: AggModuleTreeNode<ComponentOperation> = {
    module: operationTypeAggModule,
    disableSubmoduleCollapse: true,
    submodules: [{
        module: operationEntityAggModule,
        forceSubmoduleCollapse: true,
        submodules: [{
            module: entityOperationTypeAggModule,
            submodules: [
                { module: operationCauseAggModule, disableOnNoExtraInfo: true },
                {
                    module: propertyPathV1AggModule,
                    submodules: propertyValueSubModules,
                    requiredCharacteristics: { [CompOpAggCharacteristics.AFFECTED_ENTITY]: 'Property' }
                },
                {
                    module: propertyPathV2AggModule,
                    submodules: propertyValueSubModules,
                    requiredCharacteristics: { [CompOpAggCharacteristics.AFFECTED_ENTITY]: 'Property' }
                },
                {
                    module: dependencyRelationshipSourcePropertyPathV1AggModule,
                    submodules: dependencyRelationshipAttributePathSubModules,
                    requiredCharacteristics: { [CompOpAggCharacteristics.AFFECTED_ENTITY]: 'Dependency Relationship' }
                },
                {
                    module: dependencyRelationshipSourcePropertyPathV1AggModule,
                    submodules: dependencyRelationshipAttributePathSubModules,
                    requiredCharacteristics: { [CompOpAggCharacteristics.AFFECTED_ENTITY]: 'Dependency Relationship' }
                }
            ]
        }],
    }],
};

export const componentOperationAggModuleTree: AggModuleTreeNode<ComponentOperation> = {
    module: componentTypeAggModule,
    forceSubmoduleCollapse: true,
    submodules: [{
        module: componentSubtypeAggModule,
        submodules: [componentOperationSpecificAggModuleTree],
    }]
};