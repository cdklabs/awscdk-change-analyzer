import {mergeObjects} from './object';

export const IAM_POLICY_RESOURCES = [
  'AWS::ECR::RegistryPolicy',
  'AWS::EventSchemas::RegistryPolicy',
  'AWS::FMS::Policy',
  'AWS::IAM::ManagedPolicy',
  'AWS::IAM::Policy',
  'AWS::IoT::Policy',
  'AWS::S3::BucketPolicy',
  'AWS::S3ObjectLambda::AccessPointPolicy',
  'AWS::S3Outposts::BucketPolicy',
  'AWS::SNS::TopicPolicy',
  'AWS::SQS::QueuePolicy',
  'AWS::SecretsManager::ResourcePolicy',
];

export const IAM_LAMBDA_PERMISSION = [
  'AWS::Lambda::Permission',
];

export const IAM_MANAGED_POLICIES = {
  'AWS::IAM::Group': [ 'ManagedPolicyArns' ],
  'AWS::IAM::Role': [ 'ManagedPolicyArns' ],
  'AWS::IAM::User': [ 'ManagedPolicyArns' ],
};

export const IAM_INLINE_IDENTITY_POLICIES = {
  'AWS::IAM::Group': [ 'Policies' ],
  'AWS::IAM::Role': [ 'Policies' ],
  'AWS::IAM::User': [ 'Policies' ],
};

export const IAM_INLINE_RESOURCE_POLICIES = {
  'AWS::ApiGateway::RestApi': [ 'Policy' ],
  'AWS::Backup::BackupVault': [ 'AccessPolicy' ],
  'AWS::CodeArtifact::Domain': [ 'PermissionsPolicyDocument' ],
  'AWS::CodeArtifact::Repository': [ 'PermissionsPolicyDocument' ],
  'AWS::EC2::VPCEndpoint': [ 'PolicyDocument' ],
  'AWS::ECR::PublicRepository': [ 'RepositoryPolicyText' ],
  'AWS::ECR::Repository': [ 'RepositoryPolicyText' ],
  'AWS::EFS::FileSystem': [ 'FileSystemPolicy' ],
  'AWS::IAM::Role': [ 'AssumeRolePolicyDocument' ],
  'AWS::KMS::Key': [ 'KeyPolicy' ],
  'AWS::KMS::ReplicaKey': [ 'KeyPolicy' ],
  'AWS::S3::AccessPoint': [ 'Policy' ],
  'AWS::S3Outposts::AccessPoint': [ 'Policy' ],
  'AWS::SNS::Subscription': [ 'RedrivePolicy' ],
  'AWS::SSO::PermissionSet': [ 'InlinePolicy' ],
  'AWS::SageMaker::ModelPackageGroup': [ 'ModelPackageGroupPolicy' ],
  'AWS::Serverless::Function': [ 'AssumeRolePolicyDocument' ],
};

export const IAM_POLICY_PROPERTIES = mergeObjects(
  IAM_MANAGED_POLICIES,
  IAM_INLINE_IDENTITY_POLICIES,
  IAM_INLINE_RESOURCE_POLICIES,
);
