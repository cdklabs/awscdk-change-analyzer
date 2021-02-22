import {
    Component,
    ComponentProperty,
    ComponentUpdateType,
    DependencyRelationship,
    InfraModel,
    ComponentPropertyValue
} from "../../infra-model";
import { CFParserArgs } from "./cf-parser-args";
import { CFRef } from "./cf-ref";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export type CFProperty = Array<CFProperty> | Record<string, CFProperty> | string | number;

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
                        ref.getDescription()
                    )
                )
        );
        model.components.push(this.component);
    }

    protected createDependencyRelationshipFromRef(targetCFEntity: CFEntity, ref: CFRef): DependencyRelationship{
        return this.createDependencyRelationship(
            targetCFEntity.getComponentInAttributePath(ref.destPath),
            ref.getDescription()
        );
    }

    protected createDependencyRelationship(targetComponent: Component, type: string): DependencyRelationship {
        const relationship = new DependencyRelationship(
            this.component, targetComponent, type
        );

        this.component.addOutgoing(relationship);

        return relationship;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getComponentInAttributePath(attributePath:string[]): Component{
        return this.component;
    }

    /**
     * A ComponentProperty factory that takes a CloudFormation definition (js object)
     * and recursively creates the respective ComponentProperty for every primitive,
     * record or array into the
     * @param definition the CloudFormation definition (js object as it comes from the template)
     * @param propertyPath the property key path that leads to this definition
     */
    protected cfDefinitionToComponentProperty(definition: CFProperty, propertyPath: string[] = []): ComponentProperty{
        return new ComponentProperty(Object.fromEntries(
            Object.entries(definition).map(([propKey, propValue]) => {
                const newPropertyPath = [...propertyPath, propKey];

                if (typeof propValue === 'string' || typeof propValue === 'number') {
                    return [propKey, new ComponentProperty(propValue,
                        this.getUpdateTypeForPropertyPath(newPropertyPath))
                    ];
                } else if (Array.isArray(propValue)) {
                    return [propKey, new ComponentProperty(
                        propValue.map((v, i) =>
                            this.cfDefinitionToComponentProperty(v, [...newPropertyPath, i.toString()])),
                        this.getUpdateTypeForPropertyPath(newPropertyPath)
                        )
                    ];
                } else if(typeof propValue === 'object' && propValue !== null) {
                    return [propKey,
                        this.cfDefinitionToComponentProperty(propValue, newPropertyPath)];
                }
                return [];
            }).filter(e => e.length === 2)
        ), this.getUpdateTypeForPropertyPath(propertyPath));
    }

    protected createComponentProperty(value: ComponentPropertyValue, propertyPath: string[]): ComponentProperty{
        return new ComponentProperty(value, this.getUpdateTypeForPropertyPath(propertyPath));
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected getUpdateTypeForPropertyPath(propertyPath: string[]): ComponentUpdateType | undefined {
        return undefined;
    }

}