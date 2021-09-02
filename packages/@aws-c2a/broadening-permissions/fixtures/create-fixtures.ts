import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { SecurityChangesRules } from '../lib';

const iamRules = SecurityChangesRules.BroadeningIamPermissions();
const securityGroupRules = SecurityChangesRules.BroadeningSecurityGroup();
const broadeningPermissions = new SecurityChangesRules(...iamRules.rules, ...securityGroupRules.rules);

writeFileSync(resolve(__dirname, 'broadening-iam-permissions.json'), iamRules.toString());
writeFileSync(resolve(__dirname, 'broadening-security-group.json'), securityGroupRules.toString());
writeFileSync(resolve(__dirname, 'broadening-permissions.json'), broadeningPermissions.toString());