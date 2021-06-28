import React from 'react';
import ReactDOM from 'react-dom';
import { JSONDeserializer } from 'change-analysis-models/export/json-deserializer';
import serializedChangeReport from '../model-diff-example.json';
import App from './App';
import { ChangeAnalysisReport } from 'change-analysis-models/change-analysis-report';

const changeReport = new JSONDeserializer<ChangeAnalysisReport>().deserialize(JSON.stringify(serializedChangeReport));
console.log(changeReport);
ReactDOM.render(<App changeReport={changeReport} />, document.getElementById('root'));