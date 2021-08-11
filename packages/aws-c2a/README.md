# AWS CDK Change Analyzer (C2A)

The AWS C2A Toolkit provides the `aws-c2a` command-line interface that can be used directly with the cloud assembly of a
AWS CDK application. `aws-c2a` analyzes two CloudFormation templates, extracts their differences and produces a report of changes, customizable with a rules language.

## Commands

### `aws-c2a diff`

Computes the difference between the current cloud assembly state and the currently deployed application. `aws-c2a diff`
outputs the report to a file and returns 0 if no differences are found.

```sh
aws-c2a diff --app='path/to/assembly/' --rules-path='path/to/rules.json' --output='path/to/output.json'
```

### `aws-c2a html`

Generate an html file that aggregates the output of `aws-c2a diff`.

```sh
aws-c2a html --report='path/to/change-report.json' --output='path/to/index.html'
```
