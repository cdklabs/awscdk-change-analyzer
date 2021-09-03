/**
 * Generates a string array to represent the path to the PolicyDocument for statements.
 *
 * For example the path to a PolicyDocument for inline identity policies are the following:
 * ```json
 * // AWS::IAM::User
 * "Properties": {
 *   "Policies": [{
 *     "PolicyDocument": {
 *       "Statement": [
 *         {...}
 *       ]
 *     }
 *   }]
 * }
 * ```
 * The query for this path would be: `this._generateStatementPath('PolicyDocument', 'Policies', '*')`
 *
 * Some policies call the PolicyDocument by another name:
 * ```json
 * // AWS::IAM::Policy
 * "Properties": {
 *   "AssumeRolePolicyDocument": {
 *     "Statement": [
 *       {...}
 *     ]
 *   }
 * }
 * ```
 * The query for this path would be: `this._generateStatementPath('AssumeRolePolicyDocument')`
 *
 * @param documentName the key for the policy document [default: PolicyDocument]
 * @param propertyPrefix the strings that prefix the policy document
 *
 * @returns a property path with the form
 * ['Properties', ...propertyPrefix, documentName, 'Statement', '*']
 */
export function generateStatementPath(documentName = 'PolicyDocument', ...propertyPrefix: string[]): string[] {
  return ['Properties', ...propertyPrefix, documentName, 'Statement', '*'];
}

/**
 * See {@link generateStatementPath}.
 *
 * @param documentName the key for the policy document [default: PolicyDocument]
 * @param propertyPrefix the strings that prefix the policy document
 *
 * @returns a property path with the form
 * ['Properties', ...propertyPrefix, documentName, 'Statement', '*', 'Effect']
 */
export function generateEffectPath(documentName = 'PolicyDocument', ...propertyPrefix: string[]): string [] {
  return [...generateStatementPath(documentName, ...propertyPrefix), 'Effect'];
}


