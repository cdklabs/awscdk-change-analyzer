import {
    Component,
    DependencyRelationship,
    InfraModel,
} from "../../infra-model";
import { CFParserArgs } from "./cf-parser-args";
import { CFRef } from "./cf-ref";

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
    public populateModel(model: InfraModel, cfEntities: Record<string, CFEntity>, externalParameters?: Record<string, CFEntity[]>): void {
        model.relationships.push(
            ...Array.from(this.dependencyRefs)
                .map(ref => {
                    return this.createDependencyRelationship(cfEntities[ref.logicalId].getComponentInAttributePath(ref.destPath), ref.getDescription());
                })
        );
        model.components.push(this.component);
    }

    protected createDependencyRelationship(targetComponent: Component, type: string): DependencyRelationship {
        const relationship = new DependencyRelationship(
            this.component, targetComponent, type
        );

        this.component.addOutgoing(relationship);

        return relationship;
    }

    getComponentInAttributePath(attributePath:string[]): Component{
        return this.component;
    }
}