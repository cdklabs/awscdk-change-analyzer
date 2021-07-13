import { Component, InfraModel, PropertyPath, Relationship } from 'cdk-change-analyzer-models';
import { CFEntity } from './cf-entity';
import { CFParserArgs } from './cf-parser-args';
import { CFResource } from './cf-resource';
import { CFParser } from './cf-parser';
import { CFOutput } from './cf-output';
import { CFRef } from './cf-ref';
import { partitionArray } from 'cdk-change-analyzer-models';


export class CFNestedStack extends CFResource {

    readonly innerCFEntities: Record<string, CFEntity>;
    readonly innerCFParser: CFParser;
    readonly parameterRefs: CFRef[];

    protected generateComponent(name: string, definition:Record<string, any>): Component {
        return new Component(name, 'Resource', {subtype: definition.Type, properties: this.cfDefinitionToComponentProperty(definition)});
    }

    constructor(name: string, definition: Record<string, any>, args: CFParserArgs){
        super(name, definition, args);

        [this.dependencyRefs, this.parameterRefs] = partitionArray(
            this.dependencyRefs,
            (ref) => (ref.sourcePath[0] !== 'Properties' || ref.sourcePath[1] !== 'Parameters')
        );

        const nestedStackName = this.component.name;
        if(!this.parserArgs.nestedStacks || !{}.hasOwnProperty.call(this.parserArgs.nestedStacks, nestedStackName))
            throw Error(`Cannot evaluate nested stack '${nestedStackName}'. Its template was not provided`);

        const innerStack = this.parserArgs.nestedStacks[nestedStackName];
        this.innerCFParser = new CFParser(innerStack, nestedStackName);
        this.innerCFEntities = this.innerCFParser.createCFEntities(this.component, {nestedStacks: this.parserArgs.nestedStacks});
    }

    public populateModel(model: InfraModel, nodes: Record<string, CFEntity>): void {
        super.populateModel(model, nodes);
        
        const cfEntitiesReferencedByParameters = {} as Record<string, CFEntity[]>;

        this.parameterRefs.forEach(ref => {
            const parameterName = ref.sourcePath[2]; // 'Properties', 'Parameters', [parameterName]
            if(!cfEntitiesReferencedByParameters[parameterName]){
                cfEntitiesReferencedByParameters[parameterName] = [];
            }
            cfEntitiesReferencedByParameters[parameterName].push(nodes[ref.logicalId]);
        });

        const nestedModel = this.innerCFParser.createModel(
            this.component,
            this.innerCFEntities,
            cfEntitiesReferencedByParameters
        );

        const crossRelationships: Relationship[] = (nestedModel.components
                .filter(c => c instanceof Component && c !== this.component) as Component[])
                .map((c:Component) => this.createDependencyRelationship(c, 'nested-stack-component'));

        model.relationships.push(...crossRelationships, ...nestedModel.relationships);
        model.components.push(...nestedModel.components.filter(c => c !== this.component));
    }

    getComponentInAttributePath(attributePath:PropertyPath):Component {
        const innerEntity = attributePath.length >= 2
            && attributePath[0] === 'Outputs'
            && this.innerCFEntities[attributePath[1]];

        if(innerEntity instanceof CFOutput) return innerEntity.getComponentInAttributePath(attributePath.slice(2));
        return this.component;
    } 

}