import { Component, Rule } from '@aws-c2a/rules';
export { Rule } from '@aws-c2a/rules';

/**
 * Given a parent rule and a AWS resource, genereate a component for
 * the AWS Resource and create a rule descending from the parent rule.
 *
 * @param resource The AWS resource to generate a component from
 * @param root The root rule to generate a child binding from
 * @returns Component representing the resource and a child rule that
 * has the component in the binding scope
 */
export function generateComponent(resource: string, root: Rule): { component: Component, rule: Rule } {
  const identifier = resource.replace(/::/g, '');
  const component = Component.fromResource(identifier, resource);
  const rule = root.createChild({ bindings: [component] });
  return { component, rule };
}
