import { InfraModel } from '@aws-c2a/models';

export interface Parser {
  parse(args: Record<any, any>):InfraModel
}