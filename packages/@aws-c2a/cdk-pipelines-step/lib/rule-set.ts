import { IGrantable } from '@aws-cdk/aws-iam';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3a from '@aws-cdk/aws-s3-assets';
import * as cdk from '@aws-cdk/core';

// keep this import separate from other imports to reduce chance for merge conflicts with v2-main
// eslint-disable-next-line no-duplicate-imports, import/order
import { Construct } from '@aws-cdk/core';

export interface RuleSetConfig {
  readonly location?: s3.Location;
}

export enum RuleSetType {
  DISK = 'DISK',
  PREDEF = 'PREDEF',
}

export abstract class RuleSet {

  public static fromPredefined(name: string): RuleSet {
    return new PreDefinedRuleSet(name);
  };
  
  public static fromDisk(path: string): RuleSet {
    return new DiskRuleSet(path);
  }

  public static broadeningPermissions(): RuleSet {
    return PreDefinedRuleSet.BROADENING_PERMISSIONS;
  }

  public constructor(public readonly setType: RuleSetType) {}

  public abstract bind(scope: Construct): RuleSetConfig;
}

export class PreDefinedRuleSet extends RuleSet {

  public static readonly BROADENING_PERMISSIONS: RuleSet = new PreDefinedRuleSet('BROADENING_PERMISSIONS');

  public constructor(public readonly name: string) {
    super(RuleSetType.PREDEF);
  }

  public bind(_: Construct): RuleSetConfig {
    return {};
  };
}

export class DiskRuleSet extends RuleSet {
  private asset?: s3a.Asset;

  public constructor(public readonly path: string, private readonly options: s3a.AssetOptions = {}) {
    super(RuleSetType.DISK);
  }

  public bind(scope: Construct): RuleSetConfig {
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
      location: {
        bucketName: this.asset.s3BucketName,
        objectKey: this.asset.s3ObjectKey,
      }
    };
  }

  public grantRead(grantee: IGrantable): void {
    if (this.asset) {
      this.asset.grantRead(grantee);
    }
  }
}

