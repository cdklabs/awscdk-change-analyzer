import * as fs from 'fs';

export async function getFileIfExists(path: string, fileName: string): Promise<string> {
  try {
    const file = await fs.promises.readFile(path, 'utf-8');
    return file;
  } catch {
    throw new Error(`${fileName} not found or unable to read at path, ${path}.`);
  }
}