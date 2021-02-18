import { InfraModel } from "../infra-model/infra-model";

export interface Parser {
    parse(args: Record<any, any>):InfraModel
}