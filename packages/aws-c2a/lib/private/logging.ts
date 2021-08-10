import { Writable } from 'stream';
import * as colors from 'colors/safe';

type StyleFunction = (s: string) => string;
const {stdout, stderr} = process;

const log = (stream: Writable, ...styles: StyleFunction[])  => (message: string) => {
  const out = styles.reduce((acc, style) => style(acc), message);
  stream.write(out + '\n');
};

export const error = log(stderr, colors.red);
export const warning = log(stderr, colors.yellow);
export const success = log(stderr, colors.green);
export const emphasize = log(stderr, colors.bold);
export const print = log(stderr);
export const data = log(stdout);