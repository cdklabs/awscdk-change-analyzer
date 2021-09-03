import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { IamChanges, SecurityGroup, PresetRules } from '../lib';

const iamRules = IamChanges.BroadeningPermissions();
const securityGroupRules = SecurityGroup.BroadeningPermissions();
const broadeningPermissions = new PresetRules(...iamRules.rules, ...securityGroupRules.rules);

writeFileSync(resolve(__dirname, 'broadening-iam-permissions.json'), iamRules.toString());
writeFileSync(resolve(__dirname, 'broadening-security-group.json'), securityGroupRules.toString());
writeFileSync(resolve(__dirname, 'broadening-permissions.json'), broadeningPermissions.toString());