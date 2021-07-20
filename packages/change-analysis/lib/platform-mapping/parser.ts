import { InfraModel } from 'cdk-change-analyzer-models';

export interface Parser {
  parse(args: Record<any, any>):InfraModel
}