import React from 'react';
import ReactDOM from 'react-dom';
import { JSONDeserializer } from 'cdk-change-analyzer-models/export/json-deserializer';
import serializedChangeReport from '../model-diff-example.json';
import App from './App';
import { ChangeAnalysisReport } from 'cdk-change-analyzer-models/change-analysis-report';
import { Intro } from './Intro';
import 'intro.js/introjs.css';

const changeReport = new JSONDeserializer<ChangeAnalysisReport>().deserialize(JSON.stringify(serializedChangeReport));
console.log(changeReport);
ReactDOM.render(<><Intro /><App changeReport={changeReport} /></>, document.getElementById('root'));