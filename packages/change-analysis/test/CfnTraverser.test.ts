import * as AWS from 'aws-sdk';
import { CfnTraverser, DefaultC2AHost, IC2AHost, TemplateTree } from '../lib';

// function promise(input: string): Promise<any> {
//   return new Promise((resolve) => {
//     let wait = setTimeout(() => {
//       clearTimeout(wait);
//       resolve({ template: input });
//     });
//   });
// }

// class MockHost implements IC2AHost {
//   public async describeCfnStack(stackName: string): Promise<AWS.CloudFormation.Stack | undefined> {
//     return undefined;
//   }
//   public async getCfnTemplate(stackName: string): Promise<any> {
//     return promise(stackName);
//   }

//   public async getS3Object(url: string): Promise<any> {
//     return promise(url);
//   }

//   public async getLocalTemplate(filePath: string): Promise<any> {
//     return promise(filePath);
//   }
// }


// const MockTemplates: {[stackName: string]: string[]} = {
//   'root': [
//     'nested1',
//     'nested2',
//   ],
//   'nested1': [
//     'nested3',
//   ],
//   'nested2': [],
//   'nested3': [
//     'nested4',
//   ],
//   'nested4': [],
// };


// describe('Cfn Traverser on mock host', () => {
//   // GIVEN
//   let host: MockHost;
//   let traverser: CfnTraverser;
//   beforeAll(() => {
//     host = new MockHost();
//     traverser = new CfnTraverser(host);
//     traverser.findNestedTemplates = (name: string): string[][] => {
//       console.log(name);
//       return MockTemplates[name].map(n => [n, n]);
//     }
//     traverser._cfnParameters = async () => [];
//   });

//   const expectation = (output: TemplateTree) => {
//     expect(output).toEqual({
//       rootTemplate: 'root',
//       nestedTemplates: {
//         nested1: {
//           rootTemplate: 'nested1',
//           nestedTemplates: {
//             nested3: {
//               rootTemplate: 'nested3',
//               nestedTemplates: {
//                 nested4: {
//                   rootTemplate: 'nested4',
//                   nestedTemplates: {}
//                 }
//               }
//             },
//           }
//         },
//         nested2: {
//           rootTemplate: 'nested2',
//           nestedTemplates: {},
//         },
//       },
//     });
//   }

//   test('successfully runs on cfn template', async () => {
//     // WHEN
//     const output = await traverser.traverseCfn('root');

//     // THEN
//     expectation(output);
//   });

//   test('successfully runs on s3 template', async () => {
//     // WHEN
//     const output = await traverser.traverseS3('root');

//     // THEN
//     expectation(output);
//   });

//   test('successfully runs on s3 template', async () => {
//     // WHEN
//     const output = await traverser.traverseLocal('root');

//     // THEN
//     expectation(output);
//   });
// });

describe('Traverse on real data', () => {
  // GIVEN
  let host: DefaultC2AHost;
  let traverser: CfnTraverser;
  beforeAll(() => {
    host = new DefaultC2AHost();
    traverser = new CfnTraverser(host);
    AWS.config.update({region: 'us-west-2'});
  });

  test('runs on cloudformation', async () => {
    const output = await traverser.traverseCfn('NestedStackApp');
  });
});