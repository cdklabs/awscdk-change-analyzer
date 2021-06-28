import { PropertyPath } from "change-analysis-models";

export function stringifyPath(path: PropertyPath): string{
    return path.filter(n => typeof n !== 'number').join('.');
}