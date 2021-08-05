import { InfraModel, Component, StructuralRelationship } from 'cdk-change-analyzer-models';
import { flatMap, fromEntries } from '../../private/node';
import { Parser } from '../parser';
import { CFEntity } from './cf-entity';
import { CFNestedStack } from './cf-nested-stack';
import { CFOutput } from './cf-output';
import { CFParameter } from './cf-parameter';
import { CFParserArgs } from './cf-parser-args';
import { CFResource } from './cf-resource';

const cfEntityFactory = (componentType: string, componentName: string, definition: any, parserArgs: CFParserArgs) => {
  switch(componentType){
    case 'Resources':
      switch(definition.Type){
        case 'AWS::CloudFormation::Stack': return new CFNestedStack(componentName, definition, parserArgs);
        default: return new CFResource(componentName, definition, parserArgs);
      }
    case 'Parameters':
      return new CFParameter(componentName, definition, parserArgs);
    case 'Outputs':
      return new CFOutput(componentName, definition, parserArgs);
    default: return undefined;
  }
};

export class CFParser implements Parser {

  private templates: Record<any, any>[];
  private name: string;

  constructor(name: string, ...templates: Record<any, any>[]) {
    this.templates = templates;
    this.name = name;
  }

  /**
     * Parses the cloudformation template
     * @param args Additional arguments for parsing the template
     */
  public parse(args?: CFParserArgs): InfraModel {
    const templateRoot = args?.templateRoot ?? new Component(this.name, 'root');

    const cfEntities = this.createCFEntities(templateRoot, args);

    return this.createModel(templateRoot, cfEntities);
  }

  /**
     * Parses the cloudformation template onto CFEntities
     */
  public createCFEntities(templateRoot: Component, args?: CFParserArgs):Record<string, CFEntity>[] {
    const entities: Record<string, CFEntity>[] = this.templates.map(template =>
      fromEntries(
        flatMap(Object.entries(template), ([componentType, definitions]) =>
          Object.entries(definitions).map(([componentName, definition]) =>
            [componentName, cfEntityFactory(componentType, componentName, definition, args ?? {})])
            .filter(e => e[1] !== undefined),
        ) as [string, CFEntity][]
      ),
    );

    entities.forEach((templateEntities) => Object.values(templateEntities).forEach(entity => {
      const rootRelationship = new StructuralRelationship(templateRoot, entity.component, 'root');
      entity.component.addIncoming(rootRelationship);
    }));

    return entities;
  }

  /**
     * Creates the final InfraModel from the parsed CFEntities
     * @param externalParameters - any referenceable CFEntities coming from outside of this template's scope
     */
  public createModel(
    templateRoot:Component,
    cfEntities: Record<string, CFEntity>[],
    externalParameters?: Record<string, CFEntity[]>,
  ):InfraModel {
    const infraModel = new InfraModel(
      [templateRoot],
      [...templateRoot.outgoing],
    );
    cfEntities.forEach(entities => Object.values(entities).forEach(node => {
      node.populateModel(infraModel, entities, externalParameters);
    }));

    return infraModel;
  }
}
