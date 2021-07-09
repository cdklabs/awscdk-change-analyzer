import { InfraModel } from "change-analysis-models";

export interface Parser {
    parse(args: Record<any, any>):InfraModel
}