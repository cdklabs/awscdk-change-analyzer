import {
    Component,
    ComponentUpdateType
} from 'change-analysis-models';
import { CFEntity } from './cf-entity';
import { CFParserArgs } from './cf-parser-args';
import { specification } from '@aws-cdk/cfnspec/lib';
import { schema } from '@aws-cdk/cfnspec/lib';
import { isListProperty, isRecordType } from '@aws-cdk/cfnspec/lib/schema';
import { CFRef } from './cf-ref';
import { isDefined } from 'change-analysis-models';

const cfSpec = specification();

/**Maps a CloudFormation UpdateType ('Mutable', 'Immutable', 'Conditional')
 * to a ComponentUpdateType
 * Note: if the property is nested inside another property, this mapping does not
 * determine the final ComponentUpdateType
 */
const updateTypeMapping: Record<string, ComponentUpdateType> = {
    Immutable: ComponentUpdateType.REPLACEMENT,
    Mutable: ComponentUpdateType.NONE,
    Conditional: ComponentUpdateType.POSSIBLE_REPLACEMENT,
};

export class CFResource extends CFEntity {

    private resourceType: string;

    constructor(name: string, definition: Record<string, any>, args: CFParserArgs){
        super(name, definition, args);
        this.dependencyRefs.push(...definition.DependsOn?.map((lId: string) => typeof lId === 'string' ? new CFRef(['DependsOn'], lId) : undefined).filter(isDefined) ?? []);
    }

    protected generateComponent(name: string, definition:Record<string, any>): Component {
        this.resourceType = definition.Type;
        return new Component(name, 'Resource', {subtype: definition.Type, properties: this.cfDefinitionToComponentProperty(definition)});
    }

    /**
     * Extracts the UpdateType (Mutable, Immutable, Conditional) in the CloudFormation
     * spec and transforms it into a ComponentUpdateType (Recreate, None, etc) for a given property path
     * @param propertyPath The keys for finding the property in the definition
     */
    protected getUpdateTypeForPropertyPath(propertyPath: string[]): ComponentUpdateType {
        const resourceType = this.resourceType;
        if(propertyPath[0] === 'Properties' && resourceType) {
            const resourceSpec = cfSpec.ResourceTypes[resourceType];
            if(!resourceSpec || !resourceSpec.Properties)
                return super.getUpdateTypeForPropertyPath(propertyPath);
            const property = resourceSpec.Properties[propertyPath[1]];
            if(property && propertyPath.length >= 2)
                return this.getUpdateTypeFromPropertySpec(property, propertyPath.slice(1));
        }
        return ComponentUpdateType.NONE;
    }

    /**
     * Determines the ComponentUpdateType for a property path, based on the CloudFormation specification and its UpdateType
     * @param property the spec of the current property
     * @param propertyPath the path from the current property to the desired property
     * @param scopeUpdateType the ComponentUpdateType of the current property's parent
     */
    private getUpdateTypeFromPropertySpec(property: schema.Property, propertyPath: string[], scopeUpdateType?: ComponentUpdateType): ComponentUpdateType {
        
        const updateType = this.cfUpdateTypeToComponentUpdateType(property.UpdateType ?? 'Mutable', scopeUpdateType);
        
        if(propertyPath.length === 1 || updateType === ComponentUpdateType.NONE){
            return updateType;
        }
        
        const nextPropertyPath = isListProperty(property) ? propertyPath.slice(2) : propertyPath.slice(1);
        const itemType = (property as Record<string, string>).ItemType;

        if(itemType){
            const propertySpec = cfSpec.PropertyTypes[[this.resourceType, itemType].join('.')];
            if(propertySpec && isRecordType(propertySpec)){
                const nextProperty = propertySpec.Properties[nextPropertyPath[0]];
                if(nextProperty) {
                    return this.getUpdateTypeFromPropertySpec(nextProperty, nextPropertyPath, updateType);
                }
            }
        }
        return ComponentUpdateType.NONE;
    }

    /**
     * Defines the componentUpdateType of a property based on its CloudFormation UpdateType and the Component
     * UpdateType of it's scope (the parent ComponentPropertyValue)
     * @param cfUpdateType the CloudFormation UpdateType ('Mutable', 'Immutable', 'Conditional')
     * @param scopeUpdateType the scope's ComponentUpdateType
     */
    private cfUpdateTypeToComponentUpdateType(cfUpdateType: string, scopeUpdateType?: ComponentUpdateType){
        const propertyUpdateType = updateTypeMapping[cfUpdateType];

        if(!scopeUpdateType) return propertyUpdateType;

        if(scopeUpdateType === ComponentUpdateType.NONE || propertyUpdateType === ComponentUpdateType.NONE)
            return ComponentUpdateType.NONE;
        else if(scopeUpdateType === ComponentUpdateType.POSSIBLE_REPLACEMENT || propertyUpdateType === ComponentUpdateType.POSSIBLE_REPLACEMENT)
            return ComponentUpdateType.POSSIBLE_REPLACEMENT;
        else return ComponentUpdateType.REPLACEMENT;
    }
}