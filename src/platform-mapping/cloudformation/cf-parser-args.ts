import { Component } from "../../infra-model/component"

export interface CFParserArgs {
    parameterComponents?: Record<string, Component[]>
    parameterValues?: Record<string, string>
    importedValues?: Record<string, string>
    nestedStacks?: Record<string, Record<any, any>>
}