# Advanced Rules

A common mistake when using the `change` query is assuming the engine will obtain all
of some `type` of operation. As described in the above sections, there are some postconditions
to the construction of the diff tree that determine how to query it with high accuracy.

**Consider the following use case:**

We want to write a rule that selects all **new** Policy Document statements that have an 
effect of `Allow`, specifically, for the `AWS::IAM::ManagedPolicy` resource.

```json

```