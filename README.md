## AWS CDK Change Analyzer

The CDK Change Analyzer is a tool that aims to improve manual review of changes to AWS CDK Projects and allow automating approval of changes in continuous deployment. Enables detecting dangerous changes when using external construct libraries or when performing large refactorings.

This tool generates a comprehensive list of modifications between two CloudFormation templates (as produced by CDK), classifies them and presents them through a web application to allow manual review.

## How to run

```bash
yarn install --frozen-lockfile
npx lerna run build

cd packages/change-analysis
yarn start scenario1
```

## Repository Structure

This repository contains multiple packages managed with [lerna](https://github.com/lerna/lerna). The packages are located in the `packages` folder and contain:
- [**change-analysis**](packages/change-analysis/README.md) - Contains all logic related to change analysis and creating a report of those changes.
- **change-analysis-models** - Contains the class definitions for creating a report of detected changes, as well as serialization logic for all relevant objects.
- **web-app** - Contains a web application for visualizing and interacting with a produced change report.

![c2a - architecture](https://user-images.githubusercontent.com/26902818/124084162-9e19f800-da46-11eb-9c22-42b8f1cf1882.png)

## Concepts

This tool introduces some new concepts, described below:

### InfraModel

InfraModel is used to represent a state of the infrastructure, corresponding to a CloudFormation template.

![infra-model](https://user-images.githubusercontent.com/26902818/124086326-d91d2b00-da48-11eb-8e23-078d2b747e98.png)

Its main entities are:
- **Components** - Represent any relevant entity of the infrastructure definition, such as CloudFormation resources, parameters and outputs, or CDK Constructs. Their main fields are:
    - **type** - The type of component. Some examples are "Resource", "Parameter", "CDK-Construct".
    - **subtype** - The subtype of the component. In the case of resources, this is the type of resource (e.g. "AWS::CloudFront::Distribution", "AWS::Lambda::Function").
    - **name** - An identifier for the Component. For CloudFormation Components, it corresponds to the logical ID. It is not assumed to be unique.
- **Relationships** - Represent semantic relationships between Components. There are two types of relationships:
    - **Dependency Relationships** - Connects Components that depend on each other. In CloudFormation, these are generated from intrinsic function references and the `DependsOn` field.
    - **Structural Relationships** - Connects Components in a hierarchical structure. In CDK, these is generated from the construct tree.
- **Property Values** - Hold property values for Components. They can be primitive values, or collections of other Property Values. The _componentUpdateType_ field indicated the behavior of the component once this property has changed (e.g. "NONE", "REPLACEMENT", "POSSIBLE_REPLACEMENT").

### InfraModelDiff

In addition to InfraModel, InfraModelDiff has a few extra concepts:

- **Operation** - Describes a detected change/operation that occured between two versions of a Component or Property Value.
- **Transition** - Contains the two versions (before and after) of any entity, after two InfraModels have been matched.

This is then represented in a graph, according to the following class diagram:


![graph](https://user-images.githubusercontent.com/26902818/124144956-52863f00-da84-11eb-9fa1-57c2147f0e83.png)


## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This project is licensed under the Apache-2.0 License.
