import * as path from 'path';

export function versionNumber(): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require(path.resolve('package.json')).version.replace(/\+[0-9a-f]+$/, '');
}
