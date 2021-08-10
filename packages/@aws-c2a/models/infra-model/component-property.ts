import { JSONSerializable } from "../export/json-serializable";
import { SerializationID } from "../export/json-serializer";
import { SerializationClasses } from "../export/serialization-classes";
import { SerializedComponentProperty, SerializedComponentPropertyArray, SerializedComponentPropertyEmpty, SerializedComponentPropertyPrimitive, SerializedComponentPropertyRecord } from "../export/serialized-interfaces/infra-model/serialized-component-property";
import { flatMap, fromEntries } from "../utils";
import { ModelEntity, OutgoingReferences } from "./model-entity";
import { ModelEntityTypes } from "./model-entity-types";

/**
 * How a change in a ComponentPropertyValue
 * causes the Component to be updated
 */
export enum ComponentUpdateType {
    NONE = 'None',
    REPLACEMENT = 'Replacement',
    POSSIBLE_REPLACEMENT = 'PossibleReplacement',
}

export type PropertyPath = (string | number)[];

export type PropertyPrimitive = string | number;
export type PropertyCollectionValue = Array<ComponentPropertyValue> | Record<string, ComponentPropertyValue>;
export type ComponentPropertyValueType = PropertyPrimitive | PropertyCollectionValue;

export class ComponentPropertyAccessError extends Error {}

type NodeData = {
    readonly componentUpdateType?: ComponentUpdateType,
}

export abstract class ComponentPropertyValue/* TODO Value*/<ND extends NodeData = any, OR extends OutgoingReferences = any>
    extends ModelEntity<ND, OR>
    implements JSONSerializable {
    
    public get componentUpdateType(): ComponentUpdateType { return this.nodeData.componentUpdateType ?? ComponentUpdateType.NONE; }
    
    public abstract get value(): ComponentPropertyValueType | undefined;

    constructor(
        data: ND,
        outgoingReferences: OR,
    ) {
        super(ModelEntityTypes.property, data, outgoingReferences);
    }

    getRecord(): Record<string, ComponentPropertyValue> {
        if(!this.isRecord()){
            throw new ComponentPropertyAccessError("Trying to read component property as Record, but it is not one");
        }
        return this.value as Record<string, ComponentPropertyValue>;
    }

    getArray(): Array<ComponentPropertyValue> {
        if(!this.isArray()){
            throw new ComponentPropertyAccessError("Trying to read component property as an Array, but it is not one");
        }
        return this.value as Array<ComponentPropertyValue>;
    }

    getCollection(): Array<ComponentPropertyValue> | Record<string, ComponentPropertyValue> {
        if(this.isPrimitive()){
            throw new ComponentPropertyAccessError("Trying to read component property as a Collection, but it is not one");
        }
        return this.value as Array<ComponentPropertyValue> | Record<string, ComponentPropertyValue>;
    }

    getPrimitive(): PropertyPrimitive {
        if(!this.isPrimitive()){
            throw new ComponentPropertyAccessError("Trying to read component property as a primitive, but it is not one"); 
        }
        return this.value as PropertyPrimitive;
    }

    isRecord(): this is ComponentPropertyRecord {
        return this instanceof ComponentPropertyRecord;
    }

    isArray(): this is ComponentPropertyArray {
        return this instanceof ComponentPropertyArray;
    }

    isPrimitive(): this is ComponentPropertyPrimitive {
        return this instanceof ComponentPropertyPrimitive;
    }

    getPropertyInPath(path: PropertyPath): ComponentPropertyValue {
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

    public explode(): ComponentPropertyValue[]{
        if(this.isPrimitive() || this.value === undefined) return [this];
        
        return flatMap(Object.values(this.value), v => v.explode());
    }

    public abstract toSerialized(serialize: (obj: JSONSerializable) => SerializationID): SerializedComponentProperty;

    public abstract getSerializationClass(): string;

    public toJSON(): ComponentPropertyValueType | undefined{
        return this.value;
    }
}

interface NodeDataPrimitive extends NodeData {
    readonly value: PropertyPrimitive;
}

type OutgoingCollectionReferences = {
    readonly value: PropertyCollectionValue;
}

export abstract class ComponentCollectionProperty extends ComponentPropertyValue<NodeData, OutgoingCollectionReferences> {
    public get value(): ComponentPropertyValueType {
        return this.outgoingNodeReferences.value;
    }
}

export class ComponentPropertyRecord extends ComponentCollectionProperty  {
    constructor(value: Record<string, ComponentPropertyValue>, componentUpdateType?: ComponentUpdateType){
        super({componentUpdateType}, {value});
    }

    public toSerialized(serialize: (obj: JSONSerializable) => SerializationID): SerializedComponentPropertyRecord {
        return {
            value: fromEntries(Object.entries(this.getRecord()).map(([k, v]) => [k, serialize(v)])),
            componentUpdateType: this.componentUpdateType,
        };
    }

    public getSerializationClass(): string{
        return SerializationClasses.COMPONENT_PROPERTY_RECORD;
    }
}

export class ComponentPropertyArray extends ComponentCollectionProperty {
    constructor(value: ComponentPropertyValue[], componentUpdateType?: ComponentUpdateType){
        super({componentUpdateType}, {value});
    }

    public toSerialized(serialize: (obj: JSONSerializable) => SerializationID): SerializedComponentPropertyArray {
        return {
            value: this.getArray().map(v => serialize(v)),
            componentUpdateType: this.componentUpdateType,
        };
    }

    public getSerializationClass(): string{
        return SerializationClasses.COMPONENT_PROPERTY_ARRAY;
    }
}

export class ComponentPropertyPrimitive extends ComponentPropertyValue<NodeDataPrimitive, Record<string, never>> {

    public get value(): ComponentPropertyValueType {
        return this.nodeData.value;
    }

    constructor(value: PropertyPrimitive, componentUpdateType?: ComponentUpdateType){
        super({componentUpdateType, value}, {});
    }

    public toSerialized(): SerializedComponentPropertyPrimitive {
        return {
            value: this.getPrimitive(),
            componentUpdateType: this.componentUpdateType,
        };
    }

    public getSerializationClass(): string{
        return SerializationClasses.COMPONENT_PROPERTY_PRIMITIVE;
    }
}

export class EmptyComponentProperty extends ComponentPropertyValue {
    public get value(): ComponentPropertyValueType | undefined { return undefined; }
    
    constructor(){
        super({},{});
    }

    public toSerialized(): SerializedComponentPropertyEmpty {
        return {
            value: undefined,
            componentUpdateType: this.componentUpdateType
        };
    }

    public getSerializationClass(): string{
        return SerializationClasses.COMPONENT_PROPERTY_EMPTY;
    }
}