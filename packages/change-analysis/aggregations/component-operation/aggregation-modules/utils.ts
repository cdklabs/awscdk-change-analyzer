import { PropertyPath } from "cdk-change-analyzer-models";

export function stringifyPath(path: PropertyPath): string{
    return path.filter(n => typeof n !== 'number').join('.');
}