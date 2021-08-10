import 'intro.js/introjs.css';
import { ChangeAnalysisReport, JSONDeserializer } from 'cdk-change-analyzer-models';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { Intro } from './Intro';
import { REPORT_PLACEHOLDER } from './config';

// To enable for local development, this index file is generated on build so we are
// dynamically requiring the data file for `yarn dev`, but rely on string replacement
// for production environments after the template is created
const report = IS_PRODUCTION ? REPORT_PLACEHOLDER : JSON.stringify(require('../data.json'));
const changeReport = new JSONDeserializer<ChangeAnalysisReport>().deserialize(report);
ReactDOM.render(<><Intro /><App changeReport={changeReport} /></>, document.getElementById('root'));