import {
  Component,
  ComponentPropertyAccessError,
  InfraModel,
} from '@aws-c2a/models';
import { flatMap } from '../../private/node';
import { CFParser, CFParserArgs } from '../cloudformation';
import { Parser } from '../parser';
import { CDKConstruct } from './cdk-construct';

export class CDKParser implements Parser {

  public readonly name: string;
  private readonly cfParser: CFParser;

  constructor(name: string, ...templates: Record<any, any>[]) {
    this.name = name;
    this.cfParser = new CFParser(name, ...templates);
  }

  public parse(args?: CFParserArgs): InfraModel {
    const cfInfraModel = this.cfParser.parse(args);

    const constructsByPath = this.extractConstructsByPath(cfInfraModel);

    constructsByPath.forEach(c => c.populateAncestors(constructsByPath));

    const constructs = [...constructsByPath.values()];

    return this.buildModel(cfInfraModel, constructs);
  }

  /**
     * Extracts the CDKConstructs from the construct paths in the CDK Metadata of the InfraModel
     * @param cfInfraModel model resulting from the CloudFormation template
     */
  private extractConstructsByPath(cfInfraModel: InfraModel): Map<string, CDKConstruct> {
    const constructsByPath: Map<string, CDKConstruct> = new Map();

    cfInfraModel.components.forEach(cfComponent => {
      const constructPath = this.extractConstructPathFromCFComponent(cfComponent);
      if(!constructPath) return;
      if(!constructsByPath.has(constructPath)){
        constructsByPath.set(constructPath, new CDKConstruct(constructPath));
      }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      constructsByPath.get(constructPath)!.addChild(cfComponent);
    });

    return constructsByPath;
  }

  /**
     * Takes a Component from the CloudFormation InfraModel and returns its construct path if it exists
     * @param cfComponent the Component to extract the construct path from
     */
  private extractConstructPathFromCFComponent(cfComponent: Component): string | void {
    try {
      const metadata = (cfComponent.properties.getRecord() ?? {}).Metadata;
      if(typeof metadata === 'object' && metadata !== null){
        const resourcePath = (metadata.getRecord() ?? {})['aws:cdk:path'].value;
        delete metadata.getRecord()['aws:cdk:path'];
        if(typeof resourcePath === 'string'){
          return resourcePath;
        }
      }
    } catch(e) {
      if(!(e instanceof ComponentPropertyAccessError)) throw e;
    }
  }

  /**
     * Builds the final InfraModel
     * @param cfInfraModel the CloudFormation template parsed by the CloudForamtion parser
     * @param constructs the Constructs to add to the InfraModel
     */
  private buildModel(cfInfraModel: InfraModel, constructs: CDKConstruct[]): InfraModel {
    const cfInfraRoot = cfInfraModel.components.find(c => c.incoming.size === 0);
    cfInfraRoot?.outgoing.forEach(r => r.target.removeIncoming(r));

    const components = [
      ...cfInfraModel.components.filter(c => c !== cfInfraRoot),
      ...constructs.map(c => c.component),
    ];

    const relationships = [
      ...cfInfraModel.relationships.filter(r => r.source !== cfInfraRoot),
      ...flatMap(constructs, c => [...c.component.outgoing]),
    ];

    return new InfraModel(components, relationships);
  }
}