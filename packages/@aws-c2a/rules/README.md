# AWS CDK Change Analyzer (C2A) - Rules

`@aws-c2a/rules` is a package that defines the rules language for CDK Change Analyzer.
The rules language lets you define changes, components, or behaviors that you deem
high risk. These behaviors will then be caught and surfaced by `aws-c2a diff`.

This rules language maps finds the objects in the graph generated from the
[InfraModelDiff](../../README.md#InfraModelDiff) and traverses its edges when
relating objects, such as when navigating properties or checking whether a change
applies to an object.

## Rule Definition

You can write rules that classify the risk of any change and automatically
approve/reject them. These rules are based on a custom grammar in JSON syntax.
Take the following example of a rule:

```json
{
  "description": "Allow all insert operations",
  "let": {
    "insertChange": { "change": {"type": "INSERT" } }
  },
  "effect": {
    "target": "insertChange",
    "risk": "low",
    "action": "approve"
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
