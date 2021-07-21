import { KeyObject } from "crypto";
import { IC2AHost, TemplateTree } from "./toolkit";

export interface traverseStackOptions {
  readonly stackName: string;
  getTemplate: (s: string) => Promise<any>;
  recurse: (s: string) => Promise<TemplateTree>;
}
const delayName = ([name, promise]: any[]) => 'then' in promise
  ? promise.then((result: any) => [name, result])
  : [name, promise];

export function promiseObject(obj: {[key: string]: Promise<any>}) {
  const promiseList = Object.entries(obj).map(delayName);
  return Promise.all(promiseList).then(Object.fromEntries);
}

export class CfnTraverser {
  private _host: IC2AHost;

  constructor (host: IC2AHost) {
    this._host = host;
  }

  public async traverseStack(options: traverseStackOptions): Promise<TemplateTree> {
    const {stackName, getTemplate, recurse} = options;
    const template = await getTemplate(stackName);
    const _nestedTemplates = await this.findNestedTemplates(template).reduce(async (templates, nested: string) => {
      return {...(await templates), [nested]: await recurse(nested)};
    }, {});
    return {
      rootTemplate: template,
      nestedTemplates: await promiseObject(_nestedTemplates),
    };
  }

  public async traverseS3(stackName: string): Promise<TemplateTree> {
    return this.traverseStack({
      stackName,
      getTemplate: this._host.getS3Object.bind(this._host),
      recurse: this.traverseS3.bind(this),
    });
  }

  public async traverseCfn(stackName: string): Promise<TemplateTree> {
    return this.traverseStack({
      stackName,
      getTemplate: this._host.getCfnTemplate.bind(this._host),
      recurse: this.traverseS3.bind(this),
    });
  }

  public async traverseLocal(stackName: string): Promise<TemplateTree> {
    return this.traverseStack({
      stackName,
      getTemplate: this._host.getLocalTemplate.bind(this._host),
      recurse: this.traverseLocal.bind(this),
    });
  }

  public findNestedTemplates(template: string): string[] {
    return [];
  }
}