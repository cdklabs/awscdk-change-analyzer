import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { AFTER_TEMPLATE, BEFORE_TEMPLATE } from './config';
// To enable for local development, this index file is generated on build so we are
// dynamically requiring the data file for `yarn dev`, but rely on string replacement
// for production environments after the template is created

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const before = IS_PRODUCTION ? BEFORE_TEMPLATE : JSON.stringify(require('../data/before.json'));
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const after = IS_PRODUCTION ? AFTER_TEMPLATE : JSON.stringify(require('../data/after.json'));
console.log(before);
ReactDOM.render(<App after={after} before={before} />, document.getElementById('root'));