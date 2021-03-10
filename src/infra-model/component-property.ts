/**
 * How a change in a ComponentProperty
 * causes the Component to be updated
 */
export enum ComponentUpdateType {
    NONE = 'None',
    REPLACEMENT = 'Replacement',
    POSSIBLE_REPLACEMENT = 'PossibleReplacement',
}

export type PropertyPath = (string | number)[];

export type PropertyPrimitive = string | number;
export type ComponentPropertyValue = PropertyPrimitive | Array<ComponentProperty> | Record<string, ComponentProperty>;

export class ComponentPropertyAccessError extends Error {}

export abstract class ComponentProperty {
    constructor(
        public readonly value: ComponentPropertyValue | undefined,
        public readonly componentUpdateType: ComponentUpdateType = ComponentUpdateType.NONE
    ) {}

    getRecord(): Record<string, ComponentProperty> {
        if(!this.isRecord()){
            throw new ComponentPropertyAccessError("Trying to read component property as Record, but it is not one");
        }
        return this.value as Record<string, ComponentProperty>;
    }

    getArray(): Array<ComponentProperty> {
        if(!this.isArray()){
            throw new ComponentPropertyAccessError("Trying to read component property as an Array, but it is not one");
        }
        return this.value as Array<ComponentProperty>;
    }

    isRecord(): boolean {
        return typeof this.value === 'object' && this.value !== null && !Array.isArray(this.value);
    }

    isArray(): boolean {
        return Array.isArray(this.value);
    }

    isPrimitive(): boolean {
        return !(this.isRecord || this.isArray);
    }

    getPropertyInPath(path: PropertyPath): ComponentProperty {
        if(path.length === 0){
            return this;
        } else if(typeof path[0] === 'number') {
            if(this.getArray().length <= path[0])
                throw new ComponentPropertyAccessError(`Component property array does not have any property in index ${path[0]}`);
            return this.getArray()[path[0]].getPropertyInPath(path.slice(1));
        } else if(typeof path[0] === 'string') {
            if(!this.getRecord()[path[0]])
                throw new ComponentPropertyAccessError(`Component property does not have any component for key ${path[0]}`);
            return this.getRecord()[path[0]].getPropertyInPath(path.slice(1));
        }
        throw Error(`Path includes non valid value: ${path[0]}`);
    }
}

export class ComponentCollectionProperty extends ComponentProperty {}

export class ComponentPropertyRecord extends ComponentCollectionProperty  {
    constructor(value: Record<string, ComponentProperty>, componentUpdateType?: ComponentUpdateType){
        super(value, componentUpdateType);
    }
}

export class ComponentPropertyArray extends ComponentCollectionProperty {
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