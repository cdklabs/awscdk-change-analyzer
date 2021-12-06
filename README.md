# AWS CDK Change Analyzer

The **CDK Change Analyzer** (C2A) is a tool that helps you:

* Review the changes that a CDK deployment will introduce to your infrastructure
  in a visual interface.
* Write rules to automatically classify certain changes as "safe" or "unsafe",
  making sure you only need to review changes if there is something important to
  review.

CDK Change Analyzer can be used independently, or as an integration with [CDK
Pipelines](https://github.com/cdklabs/awscdk-change-analyzer/tree/main/packages/%40aws-c2a/cdk-pipelines-step).

> ![C2A: Developer
> Preview](https://img.shields.io/badge/CDK%20Change%20Analyzer-Developer%20Preview-orange.svg?style=for-the-badge)
>
> C2A is currently in Developer Preview. Let us know how this tool is working
> for you.

## Usage

To use C2A:

1. Add a [PerformChangeAnalysis
step](https://github.com/cdklabs/awscdk-change-analyzer/tree/main/packages/%40aws-c2a/cdk-pipelines-step) to your CDK pipeline.
2. Create a JSON file to encode your own
   [rules](https://github.com/cdklabs/awscdk-change-analyzer/tree/main/packages/%40aws-c2a/rules)
   to save yourself manual reviewing time.

## Repository Structure

The CDK Change Analyzer suite of tools consists of multiple packages in this
repository. The packages are:

| Package | Purpose                   |
|---------|-----------------------------------| |
[`aws-c2a`](https://github.com/cdklabs/awscdk-change-analyzer/tree/main/packages/aws-c2a)
| A CLI to run C2A on a Cloud Assembly | |
[`@aws-c2a/cdk-pipelines-step`](https://github.com/cdklabs/awscdk-change-analyzer/tree/main/packages/%40aws-c2a/cdk-pipelines-step)
| A custom approval step for use with CDK Pipelines | |
[`@aws-c2a/rules`](https://github.com/cdklabs/awscdk-change-analyzer/tree/main/packages/%40aws-c2a/rules)
| Defines the rules language used by C2A to automatically identify changes to
approve | |
[`@aws-c2a/visualizer`](https://github.com/cdklabs/awscdk-change-analyzer/tree/main/packages/%40aws-c2a/visualizer)
| A tool to visualize the graph model underlying the C2A rules. | |
[`@aws-c2a/presets`](https://github.com/cdklabs/awscdk-change-analyzer/tree/main/packages/%40aws-c2a/presets)
| Rules packs that are vended by AWS | |
[`@aws-c2a/web-app`](https://github.com/cdklabs/awscdk-change-analyzer/tree/main/packages/%40aws-c2a/web-app)
| The web interface that displays the differences between a deployed CDK
application and an upcoming revision | |
[`@aws-c2a/models`](https://github.com/cdklabs/awscdk-change-analyzer/tree/main/packages/%40aws-c2a/models)
| Definition of the C2A object model | |
[`@aws-c2a/engine`](https://github.com/cdklabs/awscdk-change-analyzer/tree/main/packages/%40aws-c2a/engine)
| The engine that analyzes and reports changes between two instances of the
*model* |

![c2a -
architecture](https://user-images.githubusercontent.com/26902818/124084162-9e19f800-da46-11eb-9c22-42b8f1cf1882.png)


## Developing

We use `yarn workspaces` and `lerna` to manage our monorepo. To learn more about
the repository structure, check out the documentation [here](docs/structure.md).

```bash yarn install --frozen-lockfile yarn build # You will first need to
deploy the app/integ.nested-stacks.js file yarn workspace aws-c2a run start
nested-stacks ```

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more
information.

## License

This project is licensed under the Apache-2.0 License.
