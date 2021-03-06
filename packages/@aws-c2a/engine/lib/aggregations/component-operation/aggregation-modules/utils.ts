import { PropertyPath } from '@aws-c2a/models';
/**
 * Used to stringify a property's path
 */
export function stringifyPath(path: PropertyPath): string{
  //Array indexes (numbers in path) are not relevant for aggregating properties
  return path.filter(n => typeof n !== 'number').join('.');
}