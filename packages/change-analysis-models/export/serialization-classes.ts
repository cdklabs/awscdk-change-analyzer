export enum SerializationClasses {
    // INFRA MODEL
    COMPONENT = "Component", 
    STRUCTURAL_RELATIONSHIP = "StructuralRelationship", 
    DEPENDENCY_RELATIONSHIP = "DependencyRelationship", 
    COMPONENT_PROPERTY_RECORD = "ComponentPropertyRecord", 
    COMPONENT_PROPERTY_ARRAY = "ComponentPropertyArray", 
    COMPONENT_PROPERTY_PRIMITIVE = "ComponentPropertyPrimitive", 
    COMPONENT_PROPERTY_EMPTY = "ComponentPropertyEmpty", 
    INFRA_MODEL = "InfraModel",

    // INFRA MODEL DIFF
    INFRA_MODEL_DIFF = "InfraModelDiff",
    TRANSITION = "Transition",
    INSERT_COMPONENT_OPERATION = "InsertComponentOperation",
    REMOVE_COMPONENT_OPERATION = "RemoveComponentOperation",
    REPLACE_COMPONENT_OPERATION = "ReplaceComponentOperation",
    RENAME_COMPONENT_OPERATION = "RenameComponentOperation",
    INSERT_OUTGOING_RELATIONSHIP_COMPONENT_OPERATION = "InsertOutgoingRelationshipComponentOperation",
    REMOVE_OUTGOING_RELATIONSHIP_COMPONENT_OPERATION = "RemoveOutgoingRelationshipComponentOperation",
    UPDATE_OUTGOING_RELATIONSHIP_COMPONENT_OPERATION = "UpdateOutgoingRelationshipComponentOperation",
    INSERT_PROPERTY_COMPONENT_OPERATION = "InsertPropertyComponentOperation",
    REMOVE_PROPERTY_COMPONENT_OPERATION = "RemovePropertyComponentOperation",
    UPDATE_PROPERTY_COMPONENT_OPERATION = "UpdatePropertyComponentOperation",
    MOVE_PROPERTY_COMPONENT_OPERATION = "MovePropertyComponentOperation",

    AGGREGATION = "Aggregation",

    CHANGE_ANALYSIS_REPORT = "ChangeAnalysisReport",
}