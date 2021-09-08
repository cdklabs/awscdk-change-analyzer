import { CDKParser } from '@aws-c2a/engine';
import { InfraModel } from '@aws-c2a/models';
import { flattenObjects, mapObjectValues } from './object';

export type TemplateTreeMap = {[id: string]: TemplateTree}

export interface TemplateTree {
  readonly rootTemplate: any;
  readonly nestedTemplates?: TemplateTreeMap;
}

export const flattenNestedStacks = (nestedStacks: {[id: string]: TemplateTree} | undefined ): {[id: string]: any}  => {
  return Object.entries(nestedStacks ?? {})
    .reduce((acc, [stackName, {rootTemplate, nestedTemplates}]: [string, TemplateTree]) =>
      ({...acc, [stackName]: rootTemplate, ...(flattenNestedStacks(nestedTemplates))}), {});
};

export const createModel = (trees: TemplateTreeMap): InfraModel => {
  return new CDKParser('root', ...mapObjectValues(trees, tree => tree.rootTemplate)).parse({
    nestedStacks: flattenObjects(mapObjectValues(trees, app => flattenNestedStacks(app.nestedTemplates))),
  });
};
