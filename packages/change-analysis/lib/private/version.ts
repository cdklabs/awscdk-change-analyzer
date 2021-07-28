import * as path from 'path';

export function versionNumber(): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  return require(path.resolve(__dirname, '../../../package.json')).version.replace(/\+[0-9a-f]+$/, '');
}
