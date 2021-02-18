import { Relationship } from "./relationship";

type PropertyPrimitive = string | number;

type RecursiveProperties<T> = Record<string, T | PropertyPrimitive | Array<PropertyPrimitive | T>>;
// The following eslint rule is due to the inability of having recursive types
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ComponentProperties extends RecursiveProperties<ComponentProperties> {}

interface ComponentOptions {
    readonly subtype?: string;
    readonly properties: ComponentProperties;
}

/**
 * Component is any element of the infrastructure definition
 * 
 * Examples include resources, resource groups, sets of configurations, variables,
 * or any other entity that influences the infrastructure deployment or the user's
 * perception of it in any way.
 */
export class Component {
    
    public readonly incoming: Set<Relationship> = new Set();
    public readonly outgoing: Set<Relationship> = new Set();

    /**
     * properties hold any values that should be tracked
     * by the change analysis but do not have any other relevant behaviors
     */
    public readonly properties: ComponentProperties;

    public readonly type: string;
    public readonly subtype?: string;
    public readonly name: string;

    constructor(name: string, type: string, options? : ComponentOptions){
        this.properties = options?.properties ?? {};
        this.name = name;
        this.type = type;
        this.subtype = options?.subtype;
    }

    public addOutgoing(relationship: Relationship): void{
        if(relationship.source !== this)
            throw Error("Trying to add relationship that does not belong to component");
        this.outgoing.add(relationship);
        relationship.target.incoming.add(relationship);
    }

    public addIncoming(relationship: Relationship): void {
        if(relationship.target !== this)
            throw Error("Trying to add relationship that does not belong to component");

        relationship.source.addOutgoing(relationship);
    }

    public removeOutgoing(relationship: Relationship): void{
        if(relationship.source !== this)
            throw Error("Trying to remove relationship that does not belong to component");
        this.outgoing.delete(relationship);
        relationship.target.incoming.delete(relationship);
    }

    public removeIncoming(relationship: Relationship): void {
        if(relationship.target !== this)
            throw Error("Trying to remove relationship that does not belong to component");

        relationship.source.removeOutgoing(relationship);
    }
}
