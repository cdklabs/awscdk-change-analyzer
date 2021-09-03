# AWS CDK Change Analyzer (C2A) - Presets

`@aws-c2a/presets` is a package that defines a set of rules for the
CDK Change Analyzer. 

## Broadening Permissions 

Broadening Permissions is a set of rules that apply to two
categories: IAM Policies and EC2 Security Groups.

IAM policy broadening permissions are those that add positive statements,
remove negative statements, add lambda permissions, or add managed policies.

EC2 Security Group broadening permissions are any changes.

## Getting Started

```ts
import { BroadeningPermissions } from '@aws-c2a/presets';
```
