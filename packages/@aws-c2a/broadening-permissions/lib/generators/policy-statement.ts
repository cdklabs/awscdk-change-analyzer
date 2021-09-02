import { Change, Component, Rule } from '@aws-c2a/rules';
import { generateHighRiskChild } from './high-risk-child';
import { generateEffectPath, generateStatementPath } from './path';

export function generateStatementRules(
  parent: Rule,
  component: Component,
  documentName = 'PolicyDocument',
  ...prefix: string[]
): void {
  generateHighRiskChild(parent, component, {
    change: Change.INSERT,
    equals: 'Allow',
    sourcePath: generateEffectPath(documentName, ...prefix),
  });
  generateHighRiskChild(parent, component, {
    change: Change.INSERT_PROP,
    equals: 'Allow',
    targetPath: generateStatementPath(documentName, ...prefix),
    sourcePath: ['Effect'],
  });
  generateHighRiskChild(parent, component, {
    change: Change.UPDATE_PROP,
    equals: 'Allow',
    targetPath: generateStatementPath(documentName, ...prefix),
    sourcePath: ['Effect'],
  });
}

