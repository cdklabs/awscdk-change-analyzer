import * as fn from 'fifinet';

export type OutgoingReferences = Record<
    string,
    Iterable<ModelEntity> | ModelEntity | Record<string, ModelEntity> | undefined
>;

export class ModelEntity<
        ND = any, // vertex data
        OR extends OutgoingReferences = any // vertex edge targets
    > {

    static idCounter = 0;

    public readonly nodeData: fn.VertexProps<ND>;
    protected readonly outgoingNodeReferences: OR;

    constructor(nodeData: fn.InVertex<ND>, outgoingNodeReferences: OR){
        this.nodeData = {_id: `${++ModelEntity.idCounter}`, ...nodeData};
        this.outgoingNodeReferences = outgoingNodeReferences; 
    }

    public getOutgoingNodeEdges(): fn.InEdge<{ _label: string; _in: string; _out: string; }>[] {
        const createModelEntityEdge = (label: string, e: ModelEntity, key?: string) => ({
            _label: label,
            _in: e.nodeData._id,
            _out: this.nodeData._id,
            key
        });
        
        return this.explodeDirectReferences().map(({refName, ref, key}) => createModelEntityEdge(refName, ref, key));
    }

    private explodeDirectReferences(): {refName: string, ref: ModelEntity, key?: string}[] {
        const createInfoObj = (label: string, e: ModelEntity, key?: string) => ({
            refName: label, ref: e, key
        });
        
        return Object.entries(this.outgoingNodeReferences).flatMap(([k, v]) => {
            if(v instanceof Set) {
                return [...v].map(entity => createInfoObj(k, entity));
            } else if(typeof v === 'object' && v !== null) { // arrays and objects have key on the edges
                return Object.entries(v).map(([key, e]) => createInfoObj(k, e, key));
            } else if(v !== undefined) {
                return [createInfoObj(k, v)];
            } else return [];
        });
    }

    public explodeNodeReferences(): ModelEntity[] {
        const stack: ModelEntity[] = [this];
        const result: Set<ModelEntity> = new Set();

        while(stack.length) {
            const e = stack.pop();
            if(e === undefined || result.has(e)) continue;
            result.add(e);
            stack.push(...e.explodeDirectReferences().map(({ref}) => ref));
        }

        return [...result];
    }
}