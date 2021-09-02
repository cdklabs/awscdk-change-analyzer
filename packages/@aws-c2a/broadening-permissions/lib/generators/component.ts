import { Component, Rule } from '@aws-c2a/rules';
export { Rule } from '@aws-c2a/rules';

export function generateComponent(resource: string, root: Rule): { component: Component, rule: Rule } {
  const identifier = resource.replace(/::/g, '');
  const component = Component.fromResource(identifier, resource);
  const rule = root.createChild({ bindings: [component] });
  return { component, rule };
}
