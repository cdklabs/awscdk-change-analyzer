import { Change, Component, Rule } from '@aws-c2a/rules';
import { generateHighRiskChild } from './high-risk-child';
import { generateEffectPath, generateStatementPath } from './path';

/**
 * This **highly** opinionated rule generator takes in a
 * parent rule and a AWS component and will generate 3
 * rules that apply to Policy Documents for the component.
 *
 * Mark the following behaviors as high risk:
 *  1. New `components` that have a PolicyDocument statement with
 *     an 'Allow' effect
 *  2. Additions to the PolicyDocument statement with an 'Allow' effect
 *  3. Updates to the PolicyDocument that result in an 'Allow' effect
 *
 * @param parent
 * @param component
 * @param documentName
 * @param prefix
 */
export function generateStatementRules(
  parent: Rule,
  component: Component,
  documentName = 'PolicyDocument',
  ...prefix: string[]
): void {
  // We cant target property paths within the newly created component using applies to
  // because the INSERT operation happens on the component level.
  generateHighRiskChild(parent, component, {
    change: Change.INSERT,
    equals: 'Allow',
    sourcePath: generateEffectPath(documentName, ...prefix),
  });
  // At the property level, we simply need to obtain the property path for the statement
  // and then compare the `.effect` with 'Allow'
  // NOTE: We cannot go all the way to `.Effect` in our appliesTo call because statement is
  // an array and we are detecting updates to the statement property.
  [Change.INSERT_PROP, Change.UPDATE_PROP].forEach(change => {
    generateHighRiskChild(parent, component, {
      change,
      equals: 'Allow',
      targetPath: generateStatementPath(documentName, ...prefix),
      sourcePath: ['Effect'],
    });
  });
}

