import { Component } from "change-analysis-models";

export interface CFParserArgs {
    readonly parameterValues?: Record<string, string>;
    readonly nestedStacks?: Record<string, Record<any, any>>;
    readonly templateRoot?: Component;
}