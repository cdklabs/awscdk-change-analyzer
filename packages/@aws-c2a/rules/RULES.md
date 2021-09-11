# Rules

This document describes basic use cases for the rules language that will help provide
foundational knowledge to build. 

## Table of Contents

* [Fundamentals](#fundamentals)
* [Querying Components](#querying-components)
* [Querying Change](#querying-change)
* [Applying Specificity](#applying-specificity)
* [Describing Effect](#describing-effect)
* [Nesting Rules](#nesting-rules)

## Fundamentals

The AWS C2A engine is a powerful tool that allows you to query behavior between the 
difference between two CloudFormation states. We accomplish this by creating a graph, 
where each node in this graph is a `component`, `change`, `transition`, `relationship`,
etc. These vertices are pockets of data that are linked together through edges that represent
the flow of data.

When you write a rule, you are querying for vertices and verifiying your conditions by
following edges. To better understand this notion, here is an example of two different states
and a set of simple rules to query against.

```json
// BEFORE
{
  "Resources": {
    "MyBucketF68F3FF0": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "Tags": [ { "Key": "key1", "Value": "value1" } ]
      },
      "UpdateReplacePolicy": "Retain",
      "DeletionPolicy": "Retain",
    }
  }
}
```

```json
// AFTER
{
  "Resources": {
    "MyBucketF68F3FF0": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "AccessControl": "Private",
        "Tags": [
          { "Key": "key1", "Value": "value1" },
          { "Key": "key2", "Value": "value2" }
        ]
      },
      "UpdateReplacePolicy": "Retain",
      "DeletionPolicy": "Retain",
    }
  }
}
```

Looking at the above CloudFormation templates, we can write some rules that specifically check if
there are any new properties within the bucket as follows:

```json
{
  "let": {
    "INSERT_PROPERTY": { "change": { "propertyOperationType": "INSERT" } },
    "bucket": { "Resource": "AWS::S3::Bucket" }
  },
  "then": [
    {
      "where": "INSERT_PROPERTY appliesTo bucket.Properties.AccessControl",
      "effect": { "risk": "high", "target": "INSERT_PROPERTY" }
    },
    {
      "where": "INSERT_PROPERTY appliesTo bucket.Properties.Tags.*",
      "effect": { "risk": "high", "target": "INSERT_PROPERTY" }
    }
  ]
}
```

Notice how we had to specify the `*` path for the `Properties.Tags` path because
the `Tags` property is an array. We can think about the `*` value to be any index
in the `Tags` array.

We can expand on this rule by specifically checking for the values of the tags.

```json
{
  "let": {
    "INSERT_PROPERTY": { "change": { "propertyOperationType": "INSERT" } },
    "bucket": { "Resource": "AWS::S3::Bucket" }
  },
  "then": [
    {
      "where": [
        "INSERT_PROPERTY appliesTo bucket.Properties.Tags.*",
        "INSERT_PROPERTY.new.Value == 'value2'"
      ],
      "effect": { "risk": "high", "target": "INSERT_PROPERTY" }
    }
  ]
}
```

To understand the querying system better, check out our [demo page](https://cdklabs.github.io/awscdk-change-analyzer/)
to see our visualizer in action.

You can also go to our [`simple-stacks` testing fixture](../../aws-c2a/test/fixtures/simple-stacks)
and run the following commands:

```sh
yarn build && cdk deploy -a "node app/integ.simple-stacks.js"
aws-c2a diff -a . -r rules.json
aws-c2a html -r report.json
open index.html
```

## Querying Components

In almost every rule binding, you will at some point have to query for a component,
whether that be a AWS Resource, parameter, or output. The general structure for 
performing this query is as follows:

```json
{
  "let": {
    "[identifier]": {
      "component": {
        "type": "Resource | Parameter | Output",
        "subtype": "e.g. AWS::IAM::Policy"
      }
    }
  }
}
```

### Querying AWS Resources

For simplicity, another way of writing a resource query is as follows:

```json
{
  "let": {
    "[identifier]": { "Resource": "e.g. AWS::IAM::Policy" },
  }
}
```

### Match all queries

You can query for **all** of any type of components in the following manner as well:

```json
{
  "let": {
    "[identifier]": { "component": { "type": "Resource" } },
  }
}
```

Where in the above query, we are querying all AWS resources.

## Querying Change

The `change` query allows you to select for specific behaviors. We use the `change` 
query to identify component/property operations and their relationships to components
in our diff tree.

### Component Operations

A component operation is an operation that happens on the component level. For example,
creating a new resource incurs an `InsertComponentOperation` because we are inserting 
a new resource into the tree. On the other hand, if we are changing properties within
the resource, that would be labeled as an `UpdateComponentOperation`.

A basic change query for component operations looks as follows:

```json
{
  "let": {
    "[identifier]": {
      "change": {
        "type": "INSERT | UPDATE | RENAME | REPLACE | REMOVE" 
      }
    }
  }
}
```

### Property Operations

A property operation is an operation that happens on an **existing** component. For example,
adding a new property to an **existing** resource will incur an `InsertComponentPropertyOperation`,
because we are creating a new property in the resource itself. However, updating an existing
property within the resource would be labeled as an `UpdateComponentPropertyOperation`.

A basic change query for property operations looks as follows:

```json
{
  "let": {
    "[identifier]": {
      "change": {
        "propertyOperationType": "INSERT | UPDATE | RENAME | REPLACE | REMOVE" 
      }
    }
  }
}
```

## Applying Specificity

Specificy occurs during the `where` binding of the rule. Adding specificity allows 
you to narrow the scope of operations, components, and even properties. The `where`
binding allows you to specify conditions on the nodes themselves or on the scalar 
properties existing inherent to them.

For example, the `appliesTo` operator is a core part of rule creation as it can allow
you to specify the target of a `change` operation.

```json
{
  "let": {
    "lambda": { "Resource": "AWS::Lambda::Function" },
    "INSERT_COMPONENT": { "change": { "type": "INSERT" } },
  },
  "where": "INSERT_COMPONENT appliesTo lambda"
}
```

The above condition will filter out all candidate nodes for the `INSERT_COMPONENT` query
that do not target a `AWS::Lambda::Function` resource.

### Access old/new change states

The `change` operation also has two properties that allows us to access properties that exist
within the resource.

For example, if we want to query for all new `AWS::Lambda::Function` resources with the function
name "CDK ROCKS" we can write it as such.

```json
{
  "let": {
    "lambda": { "Resource": "AWS::Lambda::Function" },
    "INSERT_COMPONENT": { "change": { "type": "INSERT" } }
  },
  "where": [
    "INSERT_COMPONENT appliesTo lambda",
    "INSERT_COMPONENT.new.Propeties.FunctionName === 'CDK ROCKS'"
  ]
}
```

Notice that the `where` binding can take an array of conditions **and** these conditions are run
sequentially.

### Applying specificity during scope declaration

You can apply your `where` binding as part of your `let` query. This is useful if you want
to chain `let` bindings and specifically want an identifier to have a smaller pool of candidates
to choose verify.

```json
{
  "let": {
    "lambda": { "Resource": "AWS::Lambda::Function" },
    "INSERT_COMPONENT": {
      "change": { "type": "INSERT" },
      "where": "INSERT_COMPONENT appliesTo lambda"
    },
    "CDK_ROCKS": {
      "where": "INSERT_COMPONENT.new.Properties.FunctionName === 'CDK ROCKS'",
    }
  }
}
```

## Describing Effect

The last part of creating a rule is defining the result of a queried behavior. There are 
two main components to an `effect` binding: risk and target. 

A basic `effect` binding would look as follows:

```json
{
  "let": { "[identifier]": {} },
  "effect": { "target": "[identifier]", "risk": "high | low | unknown" },
}
```

Notice how the value of `target` can be any identifier. While, `target` can ultimately lead to
a component, change, relationship, etc. We find that most use cases tend to have `target` point
to a `change` query.

**Note**: If you do not specify a target in your `effect` binding, it will default to `change`

## Nesting Rules

Nesting rules is an core part of optimizing engine runtime and developer workflow.
You want to nest rules whenever you find yourself repeating the same `let` bindings.
Defining a top level binding that can apply to children bindings will help you
write out your rules quickly, **and** amortize the cost of repetitive queries.

For example, let's say you want to mark any new `AWS::Lambda::Function` or `AWS::DynamoDb::Table`
resource as a `high` risk effect. You can define your `InsertComponentOperation` change query 
at a top level binding and have two child bindings that define the resources.

```json
{
  "let": { "INSERT_COMPONENT": { "change": { "type": "INSERT" } } },
  "then": [
    {
      "let": { "lambda": { "Resource": "AWS::Lambda::Function" } },
      "where": "INSERT_COMPONENT appliesTo lambda",
      "effect": { "risk": "high", "target": "INSERT_COMPONENT" } 
    },
    {
      "let": { "table": { "Resource": "AWS::DynamoDb::Table" } },
      "where": "INSERT_COMPONENT appliesTo table",
      "effect": { "risk": "high", "target": "INSERT_COMPONENT" } 
    }
  ]
}
```