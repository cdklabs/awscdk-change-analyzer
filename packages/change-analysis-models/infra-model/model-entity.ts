import * as fn from 'fifinet';
import { Serialized } from '../export/json-serializable';
import { flatMap, isDefined } from '../utils';

export type OutgoingReferences = Record<
    string,
    Iterable<ModelEntity> | ModelEntity | Record<string, ModelEntity> | undefined
>;

export class ModelEntity<
        ND extends Record<string, Serialized> = any, // vertex data
        OR extends OutgoingReferences = any // vertex edge targets
    > {

    static idCounter = 0;

    public readonly nodeData: fn.VertexProps<ND>;
    protected readonly outgoingNodeReferences: OR;

    constructor(entityType: string, nodeData: fn.InVertex<ND>, outgoingNodeReferences: OR){
        this.nodeData = {_entityType: entityType, _id: `${++ModelEntity.idCounter}`, ...nodeData};
        this.outgoingNodeReferences = outgoingNodeReferences; 
    }

    public getOutgoingNodeEdges(): fn.InEdge<{ _label: string; _in: string; _out: string; }>[] {
        const createModelEntityEdge = (label: string, e: ModelEntity, key?: string) => ({
            _label: label,
            _in: e.nodeData._id,
            _out: this.nodeData._id,
            key
        });
        
        return this.explodeDirectReferences().filter(({ref}) => isDefined(ref)).map(({refName, ref, key}) => createModelEntityEdge(refName, ref, key));
    }

    private explodeDirectReferences(): {refName: string, ref: ModelEntity, key?: string}[] {
        const createInfoObj = (label: string, e: ModelEntity, key?: string) => ({
            refName: label, ref: e, key
        });
        
        return flatMap(Object.entries(this.outgoingNodeReferences), ([k, v]) => {
            if(v instanceof ModelEntity){
                return [createInfoObj(k, v)];
            } if(v instanceof Set) {
                return [...v].map(entity => createInfoObj(k, entity));
            } else if(typeof v === 'object' && v !== null) { // arrays and objects have key on the edges
                return Object.entries(v).map(([key, e]) => createInfoObj(k, e, key));
            } else return [];
        });
    }

    private explodeNodeReferences(): ModelEntity[] {
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

    public generateOutgoingGraph() { 
        const entities = this.explodeNodeReferences();
        return new fn.Graph(entities.map(e => e.nodeData), flatMap(entities, e => e.getOutgoingNodeEdges()));
    }
}