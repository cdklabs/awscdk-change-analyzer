# AWS CDK Change Analyzer (C2A) - Broadening Permissions

`@aws-c2a/broadening-permissions` is a package that defines a set of rules for the
CDK Change Analyzer. Broadening Permissions is a set of rules that apply to two
categories: IAM Policies and EC2 Security Groups.

IAM policy broadening permissions are those that add positive statements,
remove negative statements, add lambda permissions, or add managed policies.

EC2 Security Group broadening permissions are any changes.

## Getting Started

```ts
import { SecurityChanges } from '@aws-c2a/broadening-permissions';

const rules = SecurityChanges.BroadeningPermissions().rules;
```
