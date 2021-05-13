import { JSONSerializable } from "../../export/json-serializable";
import { SerializationClasses } from "../../export/serialization-classes";
import { SerializedPropertyComponentOperation, SerializedUpdatePropertyComponentOperation } from "../../export/serialized-interfaces/infra-model-diff/serialized-component-operation";
import { ComponentPropertyValue, ComponentUpdateType, PropertyPath } from "../../infra-model";
import { arraysEqual } from "../../utils";
import { Transition } from "../transition";
import { ComponentOperation, OperationType, OpNodeData, OpOutgoingNodeReferences } from "./component-operation";

type InternalOpNodeData = {
    propertyOperationType: OperationType,
}

export type PropOpOutgoingNodeReferences = OpOutgoingNodeReferences & {
    readonly propertyTransition: Transition<ComponentPropertyValue>,
    readonly pathTransition: Transition<PropertyPath>,
}

export abstract class PropertyComponentOperation<ND extends OpNodeData = any, OR extends PropOpOutgoingNodeReferences = any>
    extends ComponentOperation<ND & InternalOpNodeData, OR> {
    
    public get pathTransition(): Transition<PropertyPath> { return this.outgoingNodeReferences.pathTransition; }
    public get propertyTransition(): Transition<ComponentPropertyValue> { return this.outgoingNodeReferences.propertyTransition; }
    public get propertyOperationType(): OperationType { return this.nodeData.propertyOperationType; }

    constructor(
        nodeData: ND,
        outgoingReferences: OR,
        propertyOperationType: OperationType,
    ){
        super(
            { ...nodeData, propertyOperationType },
            {
                exposesValues: {
                    old: outgoingReferences.propertyTransition.v1,
                    new: outgoingReferences.propertyTransition.v2,
                },
                ...outgoingReferences,
                appliesTo: [...outgoingReferences.appliesTo ?? [], ...outgoingReferences.propertyTransition.explode()],
            }, OperationType.UPDATE
        );
    }

    getUpdateType(): ComponentUpdateType {
        if(!this.propertyTransition.v2 && !this.propertyTransition.v1){
            throw Error("Property Operation has no before or after property states");
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this.propertyTransition.v1?.componentUpdateType ?? this.propertyTransition.v2!.componentUpdateType;
    }

    getV1Path(v2path: PropertyPath): PropertyPath | undefined {
        if(this.pathTransition.v1 && this.pathTransition.v2
            && v2path.length >= this.pathTransition.v2.length
            && arraysEqual(v2path, this.pathTransition.v2.slice(0, v2path.length))){
            return [...this.pathTransition.v1, ...v2path.slice(this.pathTransition.v1.length)];
        }
        return;
    }

    public toSerialized(
        serialize: (obj: JSONSerializable) => number,
    ): SerializedPropertyComponentOperation {
        return {
            ...super.toSerialized(serialize),
            pathTransition: serialize(this.pathTransition),
            propertyTransition: serialize(this.propertyTransition),
        };
    }

    public explode(): PropertyComponentOperation[] {
        return this instanceof UpdatePropertyComponentOperation ? this.getAllInnerOperations() : [this];
    }
}

export class InsertPropertyComponentOperation extends PropertyComponentOperation<OpNodeData, PropOpOutgoingNodeReferences> {

    constructor(
        nodeData: OpNodeData,
        outgoingReferences: PropOpOutgoingNodeReferences
    ){
        super(nodeData, {
            ...outgoingReferences,
            appliesTo: [...outgoingReferences.appliesTo ?? [], ...outgoingReferences.propertyTransition.v2?.explode() ?? []]
        }, OperationType.INSERT);
    }

    public getSerializationClass(): string {
        return SerializationClasses.INSERT_PROPERTY_COMPONENT_OPERATION;
    }
}

export class RemovePropertyComponentOperation extends PropertyComponentOperation {

    constructor(
        nodeData: OpNodeData,
        outgoingReferences: PropOpOutgoingNodeReferences
    ){
        super(nodeData, {
            ...outgoingReferences,
            appliesTo: [...outgoingReferences.appliesTo ?? [], ...outgoingReferences.propertyTransition.v1?.explode() ?? []]
        }, OperationType.REMOVE);
    }

    public getSerializationClass(): string {
        return SerializationClasses.REMOVE_PROPERTY_COMPONENT_OPERATION;
    }
}

export type UpdatePropOpOutgoingNodeReferences = PropOpOutgoingNodeReferences & {
    readonly innerOperations?: PropertyComponentOperation[],
}

export class UpdatePropertyComponentOperation extends PropertyComponentOperation<OpNodeData, UpdatePropOpOutgoingNodeReferences> {

    public get innerOperations(): PropertyComponentOperation[] | undefined { return this.outgoingNodeReferences.innerOperations; }

    constructor(
        nodeData: OpNodeData,
        outgoingReferences: UpdatePropOpOutgoingNodeReferences,
        operationType: OperationType = OperationType.UPDATE
    ){super(nodeData, outgoingReferences, operationType);}

    getAllInnerOperations(): PropertyComponentOperation[]{
        if(!this.innerOperations || this.innerOperations.length === 0) {
            return [this];
        }
        return this.innerOperations.flatMap(o =>
            [this, ...(
                o instanceof UpdatePropertyComponentOperation
                    ? o.getAllInnerOperations()
                    : [o]
                )
            ]
        );
    }

    getV1Path(v2path: PropertyPath): PropertyPath | undefined {
        const pathFoundSoFar = super.getV1Path(v2path);
        if(pathFoundSoFar){
            if(!this.innerOperations)
                return pathFoundSoFar;
            for(const op of this.innerOperations){
                const p = op.getV1Path(v2path);
                if(p) return p;
            }
        }
        return;
    }

    public getLeaves(): PropertyComponentOperation[] {
        if(!this.innerOperations) return [this];
        return this.innerOperations.flatMap(o => (o instanceof UpdatePropertyComponentOperation) ? o.getLeaves() : [o]);
    }

    public toSerialized(
        serialize: (obj: JSONSerializable) => number,
    ): SerializedUpdatePropertyComponentOperation {
        return {
            ...super.toSerialized(serialize),
            innerOperations: this.innerOperations?.map(o => serialize(o)),
        };
    }

    public getSerializationClass(): string {
        return SerializationClasses.UPDATE_PROPERTY_COMPONENT_OPERATION;
    }
}

export class MovePropertyComponentOperation extends UpdatePropertyComponentOperation {

    public getSerializationClass(): string {
        return SerializationClasses.MOVE_PROPERTY_COMPONENT_OPERATION;
    }
}