import { SerializationClasses } from './serialization-classes';
import { insertComponentOperationDeserializer, removeComponentOperationDeserializer, renameComponentOperationDeserializer, replaceComponentOperationDeserializer } from './deserializers/infra-model-diff/component-operations/component-operation-deserializers';
import { insertOutgoingRelationshipComponentOperationDeserializer, removeOutgoingRelationshipComponentOperationDeserializer, updateOutgoingRelationshipComponentOperationDeserializer } from './deserializers/infra-model-diff/component-operations/relationship-component-operation-deserializers';
import { insertPropertyComponentOperationDeserializer, movePropertyComponentOperationDeserializer, removePropertyComponentOperationDeserializer, updatePropertyComponentOperationDeserializer } from './deserializers/infra-model-diff/component-operations/property-component-operation-deserializer';
import { componentDeserializer } from './deserializers/infra-model/component-deserializer';
import { dependencyRelationshipDeserializer } from './deserializers/infra-model/dependency-relationship-deserializer';
import { structuralRelationshipDeserializer } from './deserializers/infra-model/structural-relationship-deserializer';
import { infraModelDeserializer } from './deserializers/infra-model/infra-model-deserializer';
import { componentPropertyArrayDeserializer, componentPropertyEmptyDeserializer, componentPropertyPrimitiveDeserializer, componentPropertyRecordDeserializer } from './deserializers/infra-model/component-property-deserializer';
import { infraModelDiffDeserializer } from './deserializers/infra-model-diff/infra-model-diff-deserializer';
import { SerializationID } from './json-serializer';
import { JSONSerializable, Serialized } from './json-serializable';
import { aggregationDeserializer } from './deserializers/aggregations/aggregation-deserializer';
import { transitionDeserializer } from './deserializers/transition-deserializer';
import { changeAnalysisReportDeserializer } from './deserializers/change-analysis-report-deserializer';

type classDeserializer = (obj: Serialized, deserialize: (id: SerializationID) => JSONSerializable) => any;

/**
 *  classToDeserializer maps the SerializationClasses to their deserializer
 */
export const classToDeserializer: Record<string, classDeserializer> = Object.freeze({
    // Infra Model
    [SerializationClasses.COMPONENT]: componentDeserializer,
    [SerializationClasses.DEPENDENCY_RELATIONSHIP]: dependencyRelationshipDeserializer,
    [SerializationClasses.STRUCTURAL_RELATIONSHIP]: structuralRelationshipDeserializer,
    [SerializationClasses.INFRA_MODEL]: infraModelDeserializer,
    [SerializationClasses.COMPONENT_PROPERTY_RECORD]: componentPropertyRecordDeserializer,
    [SerializationClasses.COMPONENT_PROPERTY_ARRAY]: componentPropertyArrayDeserializer,
    [SerializationClasses.COMPONENT_PROPERTY_EMPTY]: componentPropertyEmptyDeserializer,
    [SerializationClasses.COMPONENT_PROPERTY_PRIMITIVE]: componentPropertyPrimitiveDeserializer,

    // Infra Model Diff 
    [SerializationClasses.INFRA_MODEL_DIFF]: infraModelDiffDeserializer,
    [SerializationClasses.TRANSITION]: transitionDeserializer,
    [SerializationClasses.INSERT_COMPONENT_OPERATION]: insertComponentOperationDeserializer,
    [SerializationClasses.REMOVE_COMPONENT_OPERATION]: removeComponentOperationDeserializer,
    [SerializationClasses.REPLACE_COMPONENT_OPERATION]: replaceComponentOperationDeserializer,
    [SerializationClasses.RENAME_COMPONENT_OPERATION]: renameComponentOperationDeserializer,
    [SerializationClasses.INSERT_OUTGOING_RELATIONSHIP_COMPONENT_OPERATION]: insertOutgoingRelationshipComponentOperationDeserializer,
    [SerializationClasses.REMOVE_OUTGOING_RELATIONSHIP_COMPONENT_OPERATION]: removeOutgoingRelationshipComponentOperationDeserializer,
    [SerializationClasses.UPDATE_OUTGOING_RELATIONSHIP_COMPONENT_OPERATION]: updateOutgoingRelationshipComponentOperationDeserializer,
    [SerializationClasses.INSERT_PROPERTY_COMPONENT_OPERATION]: insertPropertyComponentOperationDeserializer,
    [SerializationClasses.REMOVE_PROPERTY_COMPONENT_OPERATION]: removePropertyComponentOperationDeserializer,
    [SerializationClasses.UPDATE_PROPERTY_COMPONENT_OPERATION]: updatePropertyComponentOperationDeserializer,
    [SerializationClasses.MOVE_PROPERTY_COMPONENT_OPERATION]: movePropertyComponentOperationDeserializer,

    [SerializationClasses.AGGREGATION]: aggregationDeserializer,

    [SerializationClasses.CHANGE_ANALYSIS_REPORT]: changeAnalysisReportDeserializer,
});