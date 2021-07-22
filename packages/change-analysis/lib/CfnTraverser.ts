import { resolveCfnProperty } from "./private/cfn";
import { deserializeStructure } from "./private/yml";
import { IC2AHost, TemplateTree } from './toolkit';
import * as path from 'path';
import { CloudAssembly } from "./CloudAssembly";

interface StackInfo {
  template: any;
  parameters?: AWS.CloudFormation.Parameters;
}

export interface traverseStackOptions {
  readonly input: string;
  getTemplate: (s: string) => Promise<any>;
  process: (response: any) => Promise<StackInfo>;
  recurse: (s: string, _logiclId?: string) => Promise<TemplateTree>;
  resolve?: (templateUrl: any) => string;
}

export class CfnTraverser {
  public readonly asm: CloudAssembly;
  private readonly _host: IC2AHost;

  /* Mapping between Cfn Logical Id and Stack Name */
  private _id2Name: {[logicalId: string]: string};

  constructor (host: IC2AHost, asm: CloudAssembly) {
    this.asm = asm;
    this._host = host;
    this._id2Name = {};
  }

  /**
   * Given a stack name, find all the children stacks and map
   * the logical id to the physical id. We need this mapping to
   * support legacy synthesis, as the legacy stacks have Cfn Parameters
   * for the s3 url that must be resolved by obtaining the parameter
   * key/value pair.
   * 
   * @param stackName The current stack name to map
   */
  public async _mapId2Name(stackName: string) {
    ((await this._host.describeStackResources(stackName)) ?? [])
      .filter(({ResourceType}) => ResourceType === 'AWS::CloudFormation::Stack')
      .forEach(({LogicalResourceId, PhysicalResourceId}) => {
        if (PhysicalResourceId)
          this._id2Name[LogicalResourceId] = PhysicalResourceId;
      });
  }

  public async _cfnParameters(stackName: string): Promise<AWS.CloudFormation.Parameters> {
    const stack = await this._host.describeCfnStack(stackName);
    const region = stack?.StackId?.split(':')[3];
    const accountId = stack?.StackId?.split(':')[4];
    const url = region?.startsWith('cn') ? 'amazonaws.com.cn' : 'amazonaws.com';
    const parameters: AWS.CloudFormation.Parameters = (stack?.Parameters ?? []).concat([
      {
        ParameterKey: 'AWS::Region',
        ParameterValue: region,
      },
      {
        ParameterKey: 'AWS::URLSuffix',
        ParameterValue: url,
      },
      {
        ParameterKey: 'AWS::AccountId',
        ParameterValue: accountId,
      },
    ]);
    return parameters;
  }

  private async traverseStack(options: traverseStackOptions): Promise<TemplateTree> {
    const {input, getTemplate, process, recurse, resolve} = options;
    const response = await getTemplate(input);
    const {template, parameters} = await process(response);

    return {
      rootTemplate: template,
      nestedTemplates: await this.findNestedTemplates(template, parameters, resolve).reduce(async (templates, [id, newInput]) => {
        return {...(await templates), [id]: await recurse(newInput, id)};
      }, {}),
    };
  }

  public async traverseS3(url: string, logicalId?: string): Promise<TemplateTree> {
    const process = async (response: any) => {
      // We guarantee the logical id being present because we always pass it in during recursion
      const stackName = this._id2Name[logicalId!] ?? logicalId!;
      await this._mapId2Name(stackName);
      const parameters = await this._cfnParameters(stackName);

      return {
        template: JSON.parse(response.Body.toString()),
        parameters,
      };
    };
  
    return this.traverseStack({
      input: url,
      getTemplate: this._host.getS3Object.bind(this._host),
      process,
      recurse: this.traverseS3.bind(this),
    });
  }

  public async traverseCfn(stackName: string): Promise<TemplateTree> {
    const process = async (response: any) => {
      await this._mapId2Name(stackName);
      const parameters = await this._cfnParameters(stackName);
  
      return {
        template: (response.TemplateBody && deserializeStructure(response.TemplateBody)) || {},
        parameters,
      };
    }
    return this.traverseStack({
      input: stackName,
      getTemplate: this._host.getCfnTemplate.bind(this._host),
      process,
      recurse: this.traverseS3.bind(this),
    });
  }

  public async traverseLocal(fileName: string): Promise<TemplateTree> {
    const filePath = path.join(this.asm.directory, fileName);
    return this.traverseStack({
      input: filePath,
      getTemplate: this._host.getLocalTemplate.bind(this._host),
      process: async (response: any) => {
        return { template: JSON.parse(response) };
      },
      recurse: this.traverseLocal.bind(this),
      resolve: (templateUrl: any) => {
        /**
         * templateUrl in the form:
         * "TemplateURL": {
         *   "Fn::Join": [
         *     '',
         *     [ ..., '/[hash].json' ]
         *   ]
         * }
         */
        const splitUrl = templateUrl['Fn::Join'][1];
        const hash = splitUrl?.slice(-1)[0].slice(1, -5);
        return this.asm.hash2Path[hash];
      } 
    });
  }

  public findNestedTemplates(template: any, parameters?: AWS.CloudFormation.Parameters, resolve?: (s: string) => string): string[][]{
    const resources = template.Resources;
    const nestedStacks = Object.entries<any>(resources ?? {})
      .filter(([_id, resource]) => resource.Type === 'AWS::CloudFormation::Stack')
      .map(([id, resource]) => {
        return [
          id, 
          resolve
            ? resolve(resource.Properties.TemplateURL)
            : resolveCfnProperty(resource.Properties.TemplateURL, parameters ?? [])
        ];
      });
    return nestedStacks.filter(([_id, resource]) => resource !== undefined) as string[][];
  }
}
