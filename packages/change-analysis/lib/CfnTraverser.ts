import { resolveCfnProperty } from "./helpers/cfn";
import { deserializeStructure } from "./helpers/yml";
import { IC2AHost, TemplateTree } from './toolkit';

interface StackInfo {
  template: any;
  parameters?: AWS.CloudFormation.Parameters;
}

export interface traverseStackOptions {
  readonly input: string;
  getTemplate: (s: string) => Promise<any>;
  process: (response: any) => Promise<StackInfo>;
  recurse: (s: string, _logiclId?: string) => Promise<TemplateTree>;
}

export class CfnTraverser {
  private readonly _host: IC2AHost;
  private _id2Name: {[logicalId: string]: string};

  constructor (host: IC2AHost) {
    this._host = host;
    this._id2Name = {};
  }

  public async _mapId2Name(stackName: string) {
    const resources = await this._host.describeStackResources(stackName);
    const nestedStacks = resources?.filter(({ResourceType}) =>
      ResourceType === 'AWS::CloudFormation::Stack');
    return nestedStacks?.forEach(({LogicalResourceId, PhysicalResourceId}) => {
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
    const {input, getTemplate, process, recurse} = options;
    console.log('getting template...');
    const response = await getTemplate(input);
    console.log('processing...');
    const {template, parameters} = await process(response);

    console.log('finding nestedTemplates...');
    return {
      rootTemplate: template,
      nestedTemplates: await this.findNestedTemplates(template, parameters).reduce(async (templates, [id, newInput]) => {
        return {...(await templates), [id]: await recurse(newInput, id)};
      }, {}),
    };
  }

  public async traverseS3(url: string, logicalId?: string): Promise<TemplateTree> {
    console.log(logicalId);
    const process = async (response: any) => {
      // We guarantee the logical id being present because we always pass it in during recursion
      const stackName = this._id2Name[logicalId!];
      await this._mapId2Name(stackName);
      const parameters = await this._cfnParameters(stackName);

      return {
        template: JSON.parse(response.Body.toString('utf8')),
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

  public async traverseLocal(filePath: string): Promise<TemplateTree> {
    return this.traverseStack({
      input: filePath,
      getTemplate: this._host.getLocalTemplate.bind(this._host),
      process: async (response: any) => {
        return { template: response };
      },
      recurse: this.traverseLocal.bind(this),
    });
  }

  public findNestedTemplates(template: any, parameters?: AWS.CloudFormation.Parameters): string[][]{
    const resources = template.Resources;
    const nestedStacks = Object.entries<any>(resources ?? {})
      .filter(([_id, resource]) => resource.Type === 'AWS::CloudFormation::Stack')
      .map(([id, resource]) => {
        return [id, resolveCfnProperty(resource.Properties.TemplateURL, parameters ?? [])]
      });
    return nestedStacks.filter(([_id, resource]) => resource !== undefined) as string[][];
  }
}
