import {
    Component,
    ComponentPropertyValue,
    ComponentUpdateType,
    DependencyRelationship,
    InfraModel,
    ComponentPropertyRecord,
    ComponentPropertyPrimitive,
    ComponentPropertyArray,
    DependencyRelationshipOptions,
    PropertyPath
} from "cdk-change-analyzer-models";
import { CFParserArgs } from "./cf-parser-args";
import { CFRef } from "./cf-ref";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export type CFDefinition = Array<CFDefinition> | Record<string, CFDefinition> | string | number;

/**
 * CFEntity builds a Component and its outgoing realtionships
 * for a given CloudFormation entity from its template definition
 */
export abstract class CFEntity {

    public readonly component: Component;
    protected dependencyRefs: CFRef[];
    protected readonly parserArgs: CFParserArgs;

    constructor(name: string, definition: Record<string, any>, args: CFParserArgs){
        this.dependencyRefs = CFRef.readRefsInExpression(definition);
        this.parserArgs = args;
        this.component = this.generateComponent(name, definition);
    }

    /**
     * Generates the component for this CFEntity, called on constructor
     * and implemented in each subclass
     * @param name - Component name
     * @param definition - CloudFormation template definition of the entity
     */
    protected abstract generateComponent(name: string, definition:Record<string, any>):Component

    /**
     * Creates and returns the outgoing relationships
     * along with any additional components and their relationships
     * 
     * @param cfEntities - Referenceable CFEntities in the scope
     * @param externalParameters - Referenceable CFEntities coming from outside of the stack's scope
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public populateModel(model: InfraModel, cfEntities: Record<string, CFEntity>, externalParameters?: Record<string, CFEntity[]>): void {
        model.relationships.push(
            ...Array.from(this.dependencyRefs)
                .map(ref =>
                    this.createDependencyRelationship(
                        cfEntities[ref.logicalId].getComponentInAttributePath(ref.destPath),
                        ref.getDescription(),
                        {sourcePropertyPath: ref.sourcePath, targetAttributePath: ref.destPath}
                    )
                )
        );
        model.components.push(this.component);
    }

    protected createDependencyRelationship(targetComponent: Component, type: string, options?: DependencyRelationshipOptions): DependencyRelationship {
        const relationship = new DependencyRelationship(
            this.component, targetComponent, type, options
        );

        this.component.addOutgoing(relationship);

        return relationship;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getComponentInAttributePath(attributePath:PropertyPath): Component{
        return this.component;
    }

    /**
     * A ComponentPropertyValue factory that takes a CloudFormation definition (js object)
     * and recursively creates the respective ComponentPropertyValue for every primitive,
     * record or array
     * @param definition the CloudFormation definition (js object as it comes from the template)
     * @param propertyPath the property key path that leads to this definition
     */
    protected cfDefinitionToComponentProperty(definition: CFDefinition): ComponentPropertyValue{
        
        const updateTypeGetter = this.getUpdateTypeForPropertyPath.bind(this);

        return factory(definition, []);
        
        function factory (definition: CFDefinition, propertyPath: string[]): ComponentPropertyValue {
            const updateType = updateTypeGetter(propertyPath);
            if (Array.isArray(definition)) {
                return new ComponentPropertyArray(
                    definition.map((v, i) => factory(v, [...propertyPath, i.toString()])),
                    updateType
                );
            } else if(typeof definition === 'object' && definition !== null) {
                return new ComponentPropertyRecord(Object.fromEntries(
                    Object.entries(definition).map(([propKey, propValue]) => {
                        const newPropertyPath = [...propertyPath, propKey];
                        return [propKey, factory(propValue, newPropertyPath)];
                    })), updateType);
            } else {
                return new ComponentPropertyPrimitive(definition, updateType);
            }
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected getUpdateTypeForPropertyPath(propertyPath: string[]): ComponentUpdateType {
        return ComponentUpdateType.NONE;
    }

}