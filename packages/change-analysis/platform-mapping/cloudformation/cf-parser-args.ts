import { Component } from "change-cd-iac-models/infra-model";

export interface CFParserArgs {
    readonly parameterValues?: Record<string, string>;
    readonly nestedStacks?: Record<string, Record<any, any>>;
    readonly templateRoot?: Component;
}