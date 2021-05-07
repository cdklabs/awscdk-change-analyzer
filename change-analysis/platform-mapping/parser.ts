import { InfraModel } from "change-cd-iac-models/infra-model/infra-model";

export interface Parser {
    parse(args: Record<any, any>):InfraModel
}