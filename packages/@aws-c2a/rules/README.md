# Rules - CDK Change Analyzer (C2A)

The C2A rules language lets you classify infrastructure changes according to risk profile.
These classifications will then be applied when you run [`aws-c2a diff`](https://github.com/cdklabs/awscdk-change-analyzer/tree/main/packages/aws-c2a) or use
the [CDK Pipelines step](https://github.com/cdklabs/awscdk-change-analyzer/tree/main/packages/%40aws-c2a/cdk-pipelines-step).

Changes can be classified along to 2 different axes:

* **Risk:** changes can be classified as *high*, *low* or *unknown* risk.
  This helps human reviewers concentrate effort on the most important types of
  changes when making a determination on whether or not to proceed with the
  deployment.
* **Effect:** changes can be automatically approved, or always rejected. In the
  former case, if all changes in a deployment are automatically classified as
  approved, the human review is skipped. Otherwise, if any of the changes in a
  deployment are rejected the deployment will fail and not proceed.

## Rule Definition

Rules operate on a [graph](https://en.wikipedia.org/wiki/Graph_(discrete_mathematics) that represent the difference between two CloudFormation templates, and contains a representation
of all the changes introduced by the difference between the two templates.

Each rule is written in a custom JSON syntax, and performs a **graph query**,
looking up vertices and and traversing edges in the graph, to find the
appropriate **change** vertices and attach a desired classification to them.

Here's an example of a very simple rule:

```js
{
  // Give the rule a useful description
  "description": "Allow all insert operations",

  // Bind identifiers. In this case, let the identifier 'insertChange' go over
  // 'change' nodes that represent an INSERT.
  "let": {
    "insertChange": { "change": {"type": "INSERT" } }
  },

  // Classify the change vertices found by 'insertChange' as 'low risk'
  // and 'automatically approved'.
  "effect": {
    "target": "insertChange",
    "risk": "low", // or "high"
    "action": "approve" // or "reject"
  }
}
```

This is a very simple rule that approves and marks all component operations of
type `INSERT` as a low risk change. It is broken down below:

**let**
The `let` field defines the bindings for a given rule. In this case, the identifier,
`insertChange`, is bound to the query that matches all `change` objects of type `INSERT`.
The `let` field acts as a scope for the rule, where each binding is executed in order,
allowing you to chain bindings in a sequential manner.

**effect**
The `effect` field defines the outcome of any objects, identified as `target`, returned
from the queries. In this case, the `target` is `insertChange`, which corresponds to all
insert operations. The risk and automatic approval behavior for these changes are
specified in the fields `risk` and `action` respectively.

## Nested Rules

Every rule has a scope; defined by the bindings that are declared in the `let` field.
You can utilize the notion of scope to chain rules together in a nested style.

```json
{
  "description": "CLOUDFRONT",
  "let": { "cf": { "Resource": "AWS::CloudFront::Distribution" } },
  "then": [
    {
      "description": "Cloudfront Distributions origin changes are risky",
      "let": {
        "change": { "change": {}, "where": "change appliesTo cf.Properties.DistributionConfig.Origins" }
      },
      "effect": {
        "risk": "high"
      }
    },
    {
      "description": "Cloudfront Distributions origin protocol security can increase",
      "let": {
        "change": { "change": {}, "where": [
          "change appliesTo cf.Properties.DistributionConfig.Origins.*.OriginProtocolPolicy",
          "change.old == 'http-only'",
          "change.new == 'https-only'"
          ]
        }
      },
      "effect": {
        "risk": "low",
        "action": "approve"
      }
    }
  ]
}
```

**then**
In this rule, the `then` field is used to apply sub-rules that have access to the bindings
declared in their parent scope.

**where**
The `where` field defines conditions that the query must satisfy. These conditions include,
but are not limited to, checking if a change applies to a given object (Component or Property)
with the operator `appliesTo`; comparing old and new values of changes to properties with
the `.old` accessor and `==` operator.

> Component and Property objects allow accessing their inner properties by using the dot (".")
notation. For example `component.someArray.*.property` will correspond to all values of key
"property" in elements of array "someArray" inside "component".
