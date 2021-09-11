# AWS CDK Change Analyzer (C2A) - Models

`@aws-c2a/models` is a package that contains the class definitions and serialization
for the `aws-c2a` engine.

## Concepts

The models package defines class definitions that are integral to the usage of AWS C2A.
These conceps are what allow C2A to analyze the differences between two infrastructure
states, and also construct a graph to describe that diff.

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