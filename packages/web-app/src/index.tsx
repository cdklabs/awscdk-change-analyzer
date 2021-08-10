import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { Intro } from './Intro';
import 'intro.js/introjs.css';
import { REPORT_PLACEHOLDER } from './config';
import { JSONDeserializer } from 'cdk-change-analyzer-models/export/json-deserializer';
import { ChangeAnalysisReport } from 'cdk-change-analyzer-models/change-analysis-report';
import data from '../data.json';

const changeReport = new JSONDeserializer<ChangeAnalysisReport>().deserialize(IS_PRODUCTION ? REPORT_PLACEHOLDER : JSON.stringify(data));
ReactDOM.render(<><Intro /><App changeReport={changeReport} /></>, document.getElementById('root'));