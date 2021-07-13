import * as fs from 'fs';
import { Component, InfraModel } from 'cdk-change-analyzer-models';
import { generateGraph } from '../../visualization/graph-generator';

export const ParserUtilsCreator =
    (parserDir: string): Record<string, any> => Object.freeze({

        stringifyComponents: (model: InfraModel) => {
            const cache = new Set();

            return JSON.stringify(model, (key, value) => {
                if (typeof value === 'object' && value !== null) {
                    if (cache.has(value)) return `[dup-ref]${value instanceof Component ? value.name : key}`;
                    cache.add(value);
                }
                return value;
            }, 4);
        },

        readSampleInput: (filename: string): any =>
            JSON.parse(fs.readFileSync(`${parserDir}/sample-inputs/${filename}`, 'utf8')),

        genGraphOnEnvFlag: (model: InfraModel, filename) =>
            process.env.RENDER_GRAPHS === 'true' && generateGraph(model, `${parserDir}/sample-outputs/${filename}`),
            
});