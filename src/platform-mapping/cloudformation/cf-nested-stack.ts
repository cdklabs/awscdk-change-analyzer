import { Component, InfraModel, Relationship } from '../../infra-model';
import { CFEntity } from './cf-entity';
import { CFParserArgs } from './cf-parser-args';
import { CFResource } from './cf-resource';
import { CFParser } from './cf-parser';
import { CFOutput } from './cf-output';
import { CFRef } from './cf-ref';

export class CFNestedStack extends CFResource {

    readonly innerCFEntities: Record<string, CFEntity>;
    readonly innerCFParser: CFParser;

    protected generateComponent(name: string, definition:Record<string, any>): Component {
        return new Component(name, 'resource', {subtype: definition.Type, properties: definition.Properties});
    }

    constructor(name: string, definition: Record<string, any>, args: CFParserArgs){
        super(name, definition, args);
        this.dependencyRefs = this.dependencyRefs.filter(ref => ref.sourcePath[0] !== 'Properties' || ref.sourcePath[1] !== 'Parameters');

        const nestedStackName = this.component.name;
        if(!this.parserArgs.nestedStacks || !{}.hasOwnProperty.call(this.parserArgs.nestedStacks, nestedStackName))
            throw Error(`Cannot evaluate nested stack '${nestedStackName}'. Its template was not provided`);

        const innerStack = this.parserArgs.nestedStacks[nestedStackName];
        this.innerCFParser = new CFParser(innerStack, nestedStackName);
        this.innerCFEntities = this.innerCFParser.createCFEntities(this.component, {nestedStacks: this.parserArgs.nestedStacks});
    }

    public populateModel(model: InfraModel, nodes: Record<string, CFEntity>): void {
        super.populateModel(model, nodes);        
        
        const parameters = Object.entries(this.component.properties.Parameters ?? {});

        const nestedModel = this.innerCFParser.createModel(this.component, this.innerCFEntities,
            Object.fromEntries(parameters.map(([innerParameterName, innerParameterVal]) =>
                [innerParameterName, CFRef.readRefsInExpression(innerParameterVal).map(ref => nodes[ref.logicalId])])
            )
        );

        const crossRelationships: Relationship[] = (nestedModel.components
                .filter(c => c instanceof Component && c !== this.component) as Component[])
                .map((c:Component) => this.createDependencyRelationship(c, 'nested-stack-component'));

        model.relationships.push(...crossRelationships, ...nestedModel.relationships);
        model.components.push(...nestedModel.components.filter(c => c !== this.component));
    }

    getComponentInAttributePath(attributePath:string[]):Component {
        const innerEntity = attributePath.length >= 2
            && attributePath[0] === 'Outputs'
            && this.innerCFEntities[attributePath[1]];

        if(innerEntity instanceof CFOutput) return innerEntity.getComponentInAttributePath(attributePath.slice(2));
        return this.component;
    } 

}