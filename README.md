# AWS CDK Change Analyzer

The CDK Change Analyzer is a tool that aims to improve manual review of changes to AWS CDK Projects and allow automating approval of changes in continuous deployment. Enables detecting dangerous changes when using external construct libraries or when performing large refactorings.

This tool generates a comprehensive list of modifications between two CloudFormation templates (as produced by CDK), classifies them and presents them through a web application to allow manual review.

## Getting Started

We use `yarn workspaces` and `lerna` to manage our monorepo. To learn more about the repository
structure, check out the documentation [here](docs/structure.md).

```bash
yarn install --frozen-lockfile
yarn build
# You will first need to deploy the app/integ.nested-stacks.js file
yarn workspace aws-c2a run start nested-stacks
```

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This project is licensed under the Apache-2.0 License.
