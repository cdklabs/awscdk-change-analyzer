import {
    Component,
    ComponentPropertyAccessError,
    InfraModel
} from "change-cd-iac-models/infra-model";
import { CFParser } from "../cloudformation";
import { Parser } from "../parser";
import { CDKConstruct } from "./cdk-construct";

export class CDKParser implements Parser {

    private readonly cfParser: CFParser;

    constructor(template: Record<any, any>) {
        this.cfParser = new CFParser(template);
    }

    public parse(): InfraModel {
        const cfInfraModel = this.cfParser.parse();

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
            const metadata = (cfComponent.properties.getRecord() ?? {})["Metadata"];
            if(typeof metadata === 'object' && metadata !== null){
                const resourcePath = (metadata.getRecord() ?? {})["aws:cdk:path"].value;
                if(typeof resourcePath === 'string'){
                    return this.extractConstructPath(resourcePath);      
                }
            }
        } catch(e) {
            if(!(e instanceof ComponentPropertyAccessError)) throw e;
        }
    }

    // Extracts the construct path from the CDK path of a resource
    private extractConstructPath(path: string): string | void {
        const constructPathMatches = path.match(/^(.*)\/Resource$/);
        if(constructPathMatches){
            return constructPathMatches[1];
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
            ...constructs.map(c => c.component)
        ];

        const relationships = [
            ...cfInfraModel.relationships.filter(r => r.source !== cfInfraRoot),
            ...constructs.flatMap(c => [...c.component.outgoing])
        ];

        return new InfraModel(components, relationships);
    }
}