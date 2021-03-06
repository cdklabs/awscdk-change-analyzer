import { Transition } from '@aws-c2a/models';
import {
  DiffCreator,
} from '../../lib/model-diffing';
import { CDKParser } from '../../lib/platform-mapping';
import { ParserUtilsCreator } from '../utils';

const dir = 'test/model-diffing';

const {
  readSampleInput,
  genGraphOnEnvFlag,
  stringifyComponents,
} = ParserUtilsCreator(dir);

test('Matching basic template', () => {
  const oldModel = new CDKParser('root', readSampleInput('simple-template-before.json')).parse();
  const newModel = new CDKParser('root', readSampleInput('simple-template-after.json')).parse();

  genGraphOnEnvFlag(oldModel, 'simple-template-before');
  genGraphOnEnvFlag(newModel, 'simple-template-after');

  const diff = new DiffCreator(new Transition({v1: oldModel, v2: newModel})).create();
  expect(stringifyComponents(diff)).toMatchSnapshot();
});

test('Matching big template', () => {
  const oldModel = new CDKParser('root', readSampleInput('kessel-run-stack-before.json')).parse();
  const newModel = new CDKParser('root', readSampleInput('kessel-run-stack-after.json')).parse();

  const diff = new DiffCreator(new Transition({v1: oldModel, v2: newModel})).create();
  expect(stringifyComponents(diff)).toMatchSnapshot();
});