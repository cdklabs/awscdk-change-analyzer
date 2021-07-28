import * as path from 'path';
import { IC2AHost } from './c2a-host';
import { CloudAssembly } from './cloud-assembly';
import { resolveCfnProperty } from './private/cfn';
import { deserializeStructure } from './private/yml';
import { TemplateTree } from './toolkit';

interface StackInfo {
  template: any;
  parameters?: AWS.CloudFormation.Parameters;
}

/**
 * The options required to traverse any stack, regardless of method.
 */
export interface traverseStackOptions {
  /**
   * The input for getTemplate
   */
  readonly input: string;
  /**
   * The function used to get the template
   */
  getTemplate: (input: string) => Promise<any>;
  /**
   * After obtaining the template, this function is run to santize the output
   * into a standard form, along with generating all the parameters tied to the
   * stack.
   */
  process: (response: any) => Promise<StackInfo>;
  /**
   * The recursive function to call after finding nested templates.
   *
   * Note: The logical id will always be passed to the recurse function.
   * We comment it here to allow flexibility between the higher level functions
   * that dont require the logical id.
   */
  recurse: (input: string, _logicalId?: string) => Promise<TemplateTree>;
  /**
   * An optional resolve function that gets called in findNestedTemplates and is
   * used to mutate the input of the recursive function.
   *
   * For example, local Template traversal need to be resolved differently. We need to first
   * do a look up between the content hash and the file path.
   */
  resolve?: (templateUrl: any) => string;
}

/**
 * A Traversal class used to recursively traverse through CloudFormation
 * Templates.
 */
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
   * Given the s3 url, return the template tree after
   * recursively searching for nested stacks.
   *
   * @param url The s3 url to grab the template
   * @param logicalId The logical id of the stack we are traversing
   */
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

  /**
   * Given the stack name, return the template tree after
   * recursively searching for nested stacks.
   *
   * @param stackName The name of the stack
   */
  public async traverseCfn(stackName: string): Promise<TemplateTree> {
    const process = async (response: any) => {
      await this._mapId2Name(stackName);
      const parameters = await this._cfnParameters(stackName);

      return {
        template: (response.TemplateBody && deserializeStructure(response.TemplateBody)) || {},
        parameters,
      };
    };
    return this.traverseStack({
      input: stackName,
      getTemplate: this._host.getCfnTemplate.bind(this._host),
      process,
      recurse: this.traverseS3.bind(this),
    });
  }

  /**
   * Given the file name, return the template tree after
   * recursively searching for nested stacks.
   *
   * @param fileName The name of the file
   */
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
      },
    });
  }

  /**
   * Return an array of nested stacks found in a template.
   *
   * @param template A CloudFormation Template
   * @param parameters The parameters associated with a given template
   * @param resolve A custom resolve function to santize nested stacks' template URLs
   * @returns An array of stacks in the form: [Logical Id, Input]
   */
  public findNestedTemplates(
    template: any,
    parameters?: AWS.CloudFormation.Parameters,
    resolve?: (s: string) => string,
  ): string[][] {
    const resources = template.Resources;
    const nestedStacks = Object.entries<any>(resources ?? {})
      .filter(([_id, resource]) => resource.Type === 'AWS::CloudFormation::Stack')
      .map(([id, resource]) => {
        const url = resource.Properties.TemplateURL;
        return [
          id,
          resolve
            ? resolve(url)
            : resolveCfnProperty(url, parameters ?? []) ?? url,
        ];
      });
    return nestedStacks.filter(([_id, resource]) => resource !== undefined) as string[][];
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

  /**
   * Given a stack name, get all the parameters for the Cloud
   * Formation Template.
   *
   * @param stackName The stack name to query
   * @returns The parameters of a CloudFormation Template
   */
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

  /**
   * Helper function that higher level functions like
   * traverseLocal, traverseS3, traverseCfn consume.
   *
   * @param options The options to traverse any given stack, regardless of method
   */
  private async traverseStack(options: traverseStackOptions): Promise<TemplateTree> {
    const {input, getTemplate, process, recurse, resolve} = options;
    const response = await getTemplate(input);
    const {template, parameters} = await process(response);

    return {
      rootTemplate: template,
      nestedTemplates: await this.findNestedTemplates(template, parameters, resolve)
        .reduce(async (templates, [id, newInput]) => {
          return {...(await templates), [id]: await recurse(newInput, id)};
        }, {}),
    };
  }
}
