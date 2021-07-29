import * as fs from "fs";
import { join } from "path";
import * as appsync from "@aws-cdk/aws-appsync";
import * as sqs from "@aws-cdk/aws-sqs";
import * as cdk from "@aws-cdk/core";

class SQSStack extends cdk.Stack {
  readonly studentQueue: sqs.IQueue;

  constructor(scope: cdk.Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);
    this.studentQueue = new sqs.Queue(this, "StudentQueue");
  }
}

interface ApiStackProps extends cdk.StackProps {
  SQSsqs: sqs.IQueue;
}

class ApiStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const account = props.env?.account || "123456789";
    const region = props.env?.region || "us-west-2";

    const api = new appsync.GraphqlApi(this, "AaaaApi", {
      name: "AaaaApi",
      xrayEnabled: true,
    });

    const mockQuery = new appsync.ResolvableField({
      returnType: appsync.GraphqlType.string(),
      dataSource: api.addNoneDataSource("none"),
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbScanTable(),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultList(),
    });
    api.addQuery("mockQuery", mockQuery);

    // Matching Calling Recording Stack

    const requestMappingTemplate = fs
      .readFileSync(join(__dirname, "request.vtl"),{ encoding: "utf-8" })
      .replace("ACCOUNT_ID", account)
      .replace("QUEUE_NAME", props.SQSsqs.queueName);

    const sqsDs = api.addHttpDataSource("SqsDs", `https://sqs.${region}.amazonaws.com/`);
    const sendSqs = new appsync.ResolvableField({
      returnType: appsync.GraphqlType.string(),
      dataSource: sqsDs,
      requestMappingTemplate: appsync.MappingTemplate.fromString(
        requestMappingTemplate
      ),
      responseMappingTemplate: appsync.MappingTemplate.fromFile(
        join(__dirname, "response.vtl")
      ),
    });

    api.addMutation("sendSqsStudentRequest", sendSqs);
  }
}

const app = new cdk.App({
  context: {
    '@aws-cdk/core:newStyleStackSynthesis': 'true',
  }
})
const stack = new SQSStack(app, 'CdkTestStack', {});
new ApiStack(app, 'CrossStack', {
  SQSsqs: stack.studentQueue,
});

app.synth();