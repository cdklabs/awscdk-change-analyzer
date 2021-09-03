import * as s3 from '@aws-cdk/aws-s3';
import * as s3a from '@aws-cdk/aws-s3-assets';
import * as cdk from '@aws-cdk/core';

// keep this import separate from other imports to reduce chance for merge conflicts with v2-main
// eslint-disable-next-line no-duplicate-imports, import/order
import { Construct } from '@aws-cdk/core';

export class RuleSet {
  public static fromDisk(path: string) {
    return new RuleSet(path);
  }

  private asset?: s3a.Asset;

  public constructor(public readonly path: string, private readonly options: s3a.AssetOptions = {}) {}

  public bind(scope: Construct): s3.Location {
    if (!this.asset) {
      this.asset = new s3a.Asset(scope, 'RuleSet', {
        path: this.path,
        ...this.options,
      });
    } else if (cdk.Stack.of(this.asset) !== cdk.Stack.of(scope)) {
      throw new Error(`RuleSet is already associated with another stack '${cdk.Stack.of(this.asset).stackName}'. ` +
        'Create a new Code instance for every stack.');
    }

    return {
      bucketName: this.asset.s3BucketName,
      objectKey: this.asset.s3ObjectKey,
    };
  }
}