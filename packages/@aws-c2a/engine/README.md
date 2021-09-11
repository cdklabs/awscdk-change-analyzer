# AWS CDK Change Analyzer (C2A) - Engine

`@aws-c2a/engine` is a package that the toolkit consumes to extracts the difference between two 
CloudFormation templates and produce a report of changes, customizable with a rules language. 

## Table of Contents
1. [Overview](#Overview)
2. [Platform Mapping](#Platform-Mapping)
3. [Model Diffing](#Model-Diffing)
4. [Aggregations](#Aggregations)
5. [Rules Processing](#rules-processing)

## Overview

The C2A architecture revolves around 4 main axis.

1. [Platform mapping](#platform-mapping) defines the relationship between a platform and the
[InfraModel](../models/README.md#InfraModel).
2. [Model diffing](#model-diffing) then takes the normalized InfraModels and diffs them
through a similiary algorithm
3. [Aggregations](#aggregations) are then applied to the output of the model diffing
to generalize operations and components
4. A [rule set](#rules-parsing) is parsed and compared against the aggregations to isolate
specific behavior a user wants to target

![c2a - architecture](https://user-images.githubusercontent.com/26902818/124084162-9e19f800-da46-11eb-9c22-42b8f1cf1882.png)

## Platform Mapping

The `platform-mapping` directory holds parsers that transform an artifact into an
[InfraModel](../models/README.md#InfraModel).

### CloudFormation Parser

[template-anatomy]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-anatomy.html

The CloudFormation parser takes any CloudFormation template and generates an
[InfraModel](../models/README.md#InfraModel)

The type of CloudFormation entity ([e.g. Resource, Parameter, Output][template-anatomy])
gets mapped to the type of _Component_. In the case of CloudFormation resources, in particular,
their type gets mapped to the _Component_'s subtype (i.e. an AWS Lambda Function resource
generates a _Component_ with type `Resource` and subtype `AWS::Lambda::Function`).

The CloudFormation parser builds instances of **CFEntity**'s subclasses, which have the
responsibility of properly building the respective _Components_, _Property Values_, and
outgoing _Dependency Relationships_.

![CFParser Component Diagram](https://user-images.githubusercontent.com/26902818/124102721-85b2d900-da58-11eb-92ac-9f7c579e9861.png)

The **CFRef** class extracts references to entities in an entity's declaration, from the
used intrinsic functions and resources' _DependsOn_ field.

The following image is an example of the created relationships:

![CFN Parser](https://user-images.githubusercontent.com/26902818/124098679-aaa54d00-da54-11eb-959a-82266d746428.png)

- References in intrinsic functions and in _DependsOn_ fields are transformed into Dependency Relationships
- Structural Relationships connect resources to their stack

### AWS CDK Parser

Parsing CDK-generated CloudFormation templates begins by using the [CloudFormation parser](#CloudFormation-Parser)
and adding a _Component_ for each CDK Construct (extracted from the CloudFormation resources metadata).
Afterwards, the stack _Component_ and its _Structural Relationships_ are removed and the CDK Construct
Components are connected to the corresponding CloudFormation resource Components, as seen here:

![CDK Parser](https://user-images.githubusercontent.com/26902818/124098672-aa0cb680-da54-11eb-9051-253934faaf34.png)

## Model Diffing

The process of diffing InfraModels is contained in the `model-diffing` directory.

In the context of AWS CDK/CloudFormation, this is where we extract the operations
(changes) that occurred between the old CloudFormation template and the new one.

The basic diff is created in `model-diffing/diff-creator.ts`. It groups components
of the same type and subtype and matches them based on their name and similarity.
This similarity is calculated by comparing the properties of each component,
in `model-diffing/property-diff.ts`.

Since detecting property operations and determining their similarity require the same
underlying logic, they are both done simultaneously in `model-diffing/property-diff.ts`.
A few notes on how this property diffing currently works:

* When calculating similarity, there is currently no distinction between arrays and sets,
so property array order is not considered. In other words, moving elements in an array
as no effect on similarity. However, _Move_ operations are still created if an element
at index 0 is matched with an element at index 1, for example.

* A weight is associated with a given similarity value, which is the number of primitive
values of the structure it applies to. Consider the following:
  ```json
  // BEFORE
  {
    "a": { "b": "string", "c": "string" },
    "d": "string"
  }

  // AFTER
  {
    "a": { "b": "string", "c": "string" },
    "d": "str"
  }
  ```
  In this example, we see that the only difference between the two states is the value
  of key `d`. For simplicity, let's define the similarity between the new and old value
  for key `d` to be `0.5`. The value of key `a` has not changed, thus has a similarity of
  `1`.
  
  We can calculate the similarity of the full properties by doing a weighted average.
  * `a` will have a weight of 4 (two keys and two values with similarity 1)
  * `d` will have a weight of 1 (because it has only 1 primitive value).
  
  The similarity for this example is `1 * (4/5) + 0.5 * (1/5) = 0.9`.

### Change Propagation

`change-propagator.ts` is responsible for taking the observed changes and propagating them:

* Modified properties with _componentUpdateType_ of `REPLACEMENT` or `POSSIBLE_REPLACEMENT`
generate an operation (change) of type _Replace_ for their component.

* Renamed _Components_ have an new _Replace_ operation.

* _Replace_ operations in _Components_ with incoming _Dependency Relationships_ generate an
Update _Operation_ to the source property of such relationships, indicating that a referenced
value may have changed.

## Aggregations

Aggregations are structures that group Operations (changes) in a tree-like structure. based
on their characteristics, according to a given structure. These are used to collapse changes
when presenting them in an interface. Take the following example:

![Aggregations Example](https://user-images.githubusercontent.com/26902818/124138218-54e59a80-da7e-11eb-8e8f-036af63da1f5.png)

These are resulting aggregations that narrow down operations by:
* type and subtype of the affected Component
* type of the operation
* target of the operation: full component or a property

The characteristics that should be grouped at each level, and how, are described in 
`aggregations/component-operation/module-tree.ts`. Aggregation modules define how to split
a group of operations and a module tree is a configuration of these modules that is used
to generate the aggregations.

## Rules Processing

Rules Processing is a core part of the engine, as it is what enables C2A to make decisions
on aggregations and behaviors that arise in the diff. The rules processing can be broken 
down into three main stages.

1. Defining scope. Scope definition is the most complex part of rules processing, and it
acts to define the candidates for all identifiers defined in the `let` bindings. These candidates
are determined through traversing the diff tree and obtaining matches to the query provided as the
value to an identifier. To learn more about `let` bindings, see [`@aws-c2a/rules`](../rules/README.md).

2. Verification. Verification happens after scope definition and mainly deals with conditions
specified in the `where` binding. All conditions have operators that will have a corresponding
handler in `rules/operator-handlers` directory. Verification is crucial for specificity and
drilling down to any type of behavior.

3. Extracting effect. Finally, in order to produce a meaningful change report, we attach any
of our verified candidates for a targeted component to a specific effect (high risk, auto 
approve, etc.).

