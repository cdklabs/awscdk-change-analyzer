import { PropertyPath } from "change-cd-iac-models/infra-model";

export function stringifyPath(path: PropertyPath): string{
    return path.filter(n => typeof n !== 'number').join('.');
}