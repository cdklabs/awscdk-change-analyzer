import { Component, InfraModel, Relationship } from "../infra-model";
import { ComponentsMatcher } from "./entity-matchers/components-matcher";
import {
    InsertComponentOperation,
    RemoveComponentOperation,
    RenameComponentOperation,
    UpdateComponentOperation,
    ComponentOperation,
    RemoveOutgoingComponentOperation,
    InsertOutgoingComponentOperation,
    UpdateOutgoingComponentOperation
} from "./operations";
import { groupArrayBy } from "../utils/arrayUtils";
import { EntityMatches } from "./entity-matchers/entities-matcher";
import { RelationshipsMatcher } from "./entity-matchers/relationships-matcher";

export class DiffCreator {
    
    componentMatches: EntityMatches<Component> = new Map();
    componentOperations: ComponentOperation[] = [];
    unmatchedNewComponents: Component[] = [];
    unmatchedOldComponents: Component[] = [];

    constructor(
        public readonly oldModel: InfraModel,
        public readonly newModel: InfraModel
    ){}

    public create(): ComponentOperation[]{
        const oldComponentsSplit = this.splitComponentsByType(this.oldModel.components);
        const newComponentsSplit = this.splitComponentsByType(this.newModel.components);

        const categories = [...new Set([...Object.keys(oldComponentsSplit), ...Object.keys(newComponentsSplit)])];
        
        categories.forEach(
            (type) => this.diffComponents(oldComponentsSplit[type] ?? [], newComponentsSplit[type] ?? [])
        );

        this.diffRelationships();

        return this.componentOperations;
    }

    /**
     * Finds matches between equally named components and between any remaining ones;
     * Returns the ComponentOperations that correspond to each component change
     * @param oldComponents The old components to match
     * @param newComponents The new components to match
     */
    private diffComponents(oldComponents: Component[], newComponents: Component[]): void{
        const unmatchedNewComponents = new Set([...newComponents]);
        const unmatchedOldComponents = new Set([...oldComponents]);

        const sameNameMatcher = new ComponentsMatcher(
                [...unmatchedNewComponents],
                [...unmatchedOldComponents]);
        const sameNameMatches = sameNameMatcher.match((a: Component, b: Component) => a.name === b.name);
        this.removeMatchesFromUnmachedSets(sameNameMatches, unmatchedNewComponents, unmatchedOldComponents);

        const renamedMatcher = new ComponentsMatcher(
                [...unmatchedNewComponents],
                [...unmatchedOldComponents]);
        const renamedMatches = renamedMatcher.match();
        this.removeMatchesFromUnmachedSets(renamedMatches, unmatchedNewComponents, unmatchedOldComponents);
        
        const propertyDiffs = new Map([...sameNameMatcher.propertyDiffs, ...renamedMatcher.propertyDiffs]);

        const removals = [...unmatchedOldComponents].map(c => new RemoveComponentOperation(c));
        const insertions = [...unmatchedNewComponents].map(c => new InsertComponentOperation(c));
        const renames = [...renamedMatches.entries()]
            .map(([newComponent, match]) => new RenameComponentOperation({newComponent, prevComponent: match.entity}));
        
        const updates = [...sameNameMatches.entries(),...renamedMatches.entries()]
            .filter((entry) => entry[1].similarity < 1)
            .map(([newComponent, match]) => new UpdateComponentOperation({prevComponent: match.entity, newComponent}, propertyDiffs.get(newComponent)));

        this.componentMatches = new Map([...this.componentMatches, ...sameNameMatches, ...renamedMatches]);
        this.componentOperations.push(...removals, ...insertions, ...renames, ...updates);
        this.unmatchedNewComponents.push(...unmatchedNewComponents);
        this.unmatchedOldComponents.push(...unmatchedOldComponents);
    }

    /**
     * Finds matches between relationships of the matched components;
     * Returns the ComponentOperations that correspond to each relationship change
     */
    private diffRelationships() {
        const unmatchedNew = new Set<Relationship>();
        const unmatchedOld = new Set<Relationship>();

        const matches = new Map([...this.componentMatches].flatMap(([newComp, {entity: oldComp}]) => {
            newComp.outgoing.forEach(r => unmatchedNew.add(r));
            oldComp.outgoing.forEach(r => unmatchedOld.add(r));
            const m = new RelationshipsMatcher([...newComp.outgoing], [...oldComp.outgoing])
                .match((a,b) => this.componentMatches.get(a.target)?.entity === b.target);
            this.removeMatchesFromUnmachedSets(m, unmatchedNew, unmatchedOld);
            return [...m.entries()];
        }));

        const operationComponentsGetter = (r: Relationship) =>
            ({prevComponent: r.source, newComponent: this.componentMatches.get(r.source)?.entity}); 

        const removals = [
            ...unmatchedOld,
            ...this.unmatchedOldComponents.flatMap(c => [...c.outgoing])
        ].map(r => new RemoveOutgoingComponentOperation(
            operationComponentsGetter(r) ,r));

        const insertions = [
            ...unmatchedNew,
            ...this.unmatchedNewComponents.flatMap(c => [...c.outgoing])
        ].map(r => new InsertOutgoingComponentOperation(
            operationComponentsGetter(r), r));
        const updates = [...matches]
            .filter((entry) => entry[1].similarity < 1)
            .map(([newRelationship, match]) => new UpdateOutgoingComponentOperation(
                operationComponentsGetter(newRelationship),
                newRelationship,
                match.entity
            ));

        this.componentOperations.push(...removals, ...insertions, ...updates);
    }

    private removeMatchesFromUnmachedSets<T>(
        matches: EntityMatches<T>,
        unmachedNewComponents: Set<T>,
        unmachedOldComponents: Set<T>
    ): void{
        [...matches.entries()].forEach(([newComp, match]) => {
            unmachedNewComponents.delete(newComp);
            unmachedOldComponents.delete(match.entity);
        });
    }

    /**
     * Splits components according to their type and subtype
     * @param components 
     */
    private splitComponentsByType(components: Component[]): Record<string, Component[]>{
        return groupArrayBy(components, (c: Component) => `${c.type}-${c.subtype}`);
    }
}
