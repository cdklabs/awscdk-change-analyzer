import { IamChanges } from "./iam-changes";
import { SecurityGroup } from "./security-group";

export const BroadeningPermissions = [
  ...IamChanges.BroadeningPermissions().rules,
  ...SecurityGroup.BroadeningPermissions().rules,
];