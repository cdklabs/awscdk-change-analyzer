import { Component, ComponentPropertyPrimitive, ComponentPropertyRecord, StructuralRelationship } from "change-analysis-models";

export class CDKConstructInitError extends Error {}

export class CDKConstruct {

    public readonly path: string[];
    public readonly component: Component;

    constructor(path: string){
        this.path = path.split('/');

        if(!this.path.length)
            throw new CDKConstructInitError("Provided construct path has no elements");

        const name = this.path[this.path.length-1];

        this.component = new Component(name, 'CDK Construct', {properties: new ComponentPropertyRecord({path: new ComponentPropertyPrimitive(path)})});
    }

    public addChild(child: Component): void{
        this.component.addOutgoing(new StructuralRelationship(this.component, child, 'construct-resource'));
    }

    private getParentPath(): string | void {
        if(this.path.length === 1) return;
        return this.path.slice(0, -1).join('/');
    }

    /**
     * Adds the construct paths of ancestor constructs to constructPaths if they don't yet exist
     * @param constructPaths existing construct paths
     */
    public populateAncestors(constructPaths: Map<string, CDKConstruct>): void{
        const parentPath = this.getParentPath();
        if(parentPath){
            let parent: CDKConstruct;
            if(!constructPaths.has(parentPath)){
                parent = new CDKConstruct(parentPath);
                constructPaths.set(parentPath, parent);
                parent.populateAncestors(constructPaths);
            } else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                parent = constructPaths.get(parentPath)!;
            }

            if(this.component.incoming.size === 0){
                parent.component.addOutgoing(new StructuralRelationship(parent.component, this.component, 'construct'));
            }
        }
        
    }
}