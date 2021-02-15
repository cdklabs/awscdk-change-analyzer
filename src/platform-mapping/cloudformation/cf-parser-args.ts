import { Component } from "../../infra-model/component"

export interface CFParserArgs {
    parameterValues?: Record<string, string>
    nestedStacks?: Record<string, Record<any, any>>
    templateRoot?: Component
}