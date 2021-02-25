/**
 * How a change in a ComponentProperty
 * causes the Component to be updated
 */
export enum ComponentUpdateType {
    NONE = 'None',
    REPLACEMENT = 'Replacement',
    POSSIBLE_REPLACEMENT = 'PossibleReplacement',
}

type PropertyPrimitive = string | number;
export type ComponentPropertyValue = PropertyPrimitive | Array<ComponentProperty> | Record<string, ComponentProperty>;

export class ComponentPropertyAccessError extends Error {}

export abstract class ComponentProperty {
    constructor(
        public readonly value: ComponentPropertyValue | undefined,
        public readonly componentUpdateType: ComponentUpdateType = ComponentUpdateType.NONE
    ) {}

    getRecord(): Record<string, ComponentProperty> {
        if(typeof this.value !== 'object' || this.value === null || Array.isArray(this.value)){
            throw new ComponentPropertyAccessError("Trying to read component property as Record, but it is not one");
        }
        return this.value as Record<string, ComponentProperty>;
    }

    getArray(): Array<ComponentProperty> {
        if(!Array.isArray(this.value)){
            throw new ComponentPropertyAccessError("Trying to read component property as an Array, but it is not one");
        }
        return this.value as Array<ComponentProperty>;
    }
}

export class ComponentPropertyCollection extends ComponentProperty {}

export class ComponentPropertyRecord extends ComponentPropertyCollection  {
    constructor(value: Record<string, ComponentProperty>, componentUpdateType?: ComponentUpdateType){
        super(value, componentUpdateType);
    }
}

export class ComponentPropertyArray extends ComponentPropertyCollection {
    constructor(value: ComponentProperty[], componentUpdateType?: ComponentUpdateType){
        super(value, componentUpdateType);
    }
}

export class ComponentPropertyPrimitive extends ComponentProperty {
    constructor(value: PropertyPrimitive, componentUpdateType?: ComponentUpdateType){
        super(value, componentUpdateType);
    }
}

export class EmptyComponentProperty extends ComponentProperty {
    constructor(){
        super(undefined);
    }
}