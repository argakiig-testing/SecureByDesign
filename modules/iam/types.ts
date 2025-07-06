/**
 * IAM Module Type Definitions
 *
 * Comprehensive types for Identity and Access Management with security-first approach
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

/**
 * Common IAM configuration options
 */
export interface BaseIamConfig {
  /** Resource tags for compliance and organization */
  tags?: Record<string, pulumi.Input<string>>;

  /** Description for the IAM resource */
  description?: pulumi.Input<string>;

  /** Path for organizing IAM resources */
  path?: pulumi.Input<string>;
}

/**
 * IAM Policy Document structure
 */
export interface PolicyStatement {
  /** Statement identifier */
  sid?: string;

  /** Effect: Allow or Deny */
  effect: 'Allow' | 'Deny';

  /** Actions allowed or denied */
  actions: string[] | string;

  /** Resources affected */
  resources?: string[] | string;

  /** Principals affected */
  principals?: {
    type: 'AWS' | 'Service' | 'Federated' | 'CanonicalUser' | '*';
    identifiers: string[] | string;
  }[];

  /** Conditions for the statement */
  conditions?: Record<string, Record<string, string | string[]>>;

  /** Not actions (inverse of actions) */
  notActions?: string[] | string;

  /** Not resources (inverse of resources) */
  notResources?: string[] | string;

  /** Not principals (inverse of principals) */
  notPrincipals?: {
    type: 'AWS' | 'Service' | 'Federated' | 'CanonicalUser' | '*';
    identifiers: string[] | string;
  }[];
}

export interface PolicyDocument {
  /** Policy version */
  version: '2012-10-17';

  /** Policy statements */
  statements: PolicyStatement[];
}

/**
 * Trust Policy configuration for IAM roles
 */
export interface TrustPolicyConfig {
  /** AWS services that can assume this role */
  services?: string[];

  /** AWS accounts that can assume this role */
  accounts?: string[];

  /** Federated providers that can assume this role */
  federatedProviders?: string[];

  /** SAML providers that can assume this role */
  samlProviders?: string[];

  /** OIDC providers that can assume this role */
  oidcProviders?: string[];

  /** Custom trust policy statements */
  customStatements?: PolicyStatement[];

  /** Require MFA for role assumption */
  requireMfa?: boolean;

  /** External ID for cross-account access */
  externalId?: string;

  /** Maximum session duration in seconds (3600-43200) */
  maxSessionDuration?: number;
}

/**
 * IAM Role configuration
 */
export interface IamRoleConfig extends BaseIamConfig {
  /** Role name */
  name: pulumi.Input<string>;

  /** Trust policy configuration */
  trustPolicy: TrustPolicyConfig;

  /** Managed policy ARNs to attach */
  managedPolicyArns?: pulumi.Input<string>[];

  /** Inline policies to attach */
  inlinePolicies?: {
    name: string;
    policy: PolicyDocument | pulumi.Input<string>;
  }[];

  /** Whether to create an instance profile */
  createInstanceProfile?: boolean;

  /** Force detaching policies when destroying */
  forceDetachPolicies?: boolean;

  /** Permissions boundary policy ARN */
  permissionsBoundary?: pulumi.Input<string>;
}

/**
 * IAM Policy configuration
 */
export interface IamPolicyConfig extends BaseIamConfig {
  /** Policy name */
  name: pulumi.Input<string>;

  /** Policy document */
  policy: PolicyDocument | pulumi.Input<string>;

  /** Name prefix for auto-generated names */
  namePrefix?: pulumi.Input<string>;
}

/**
 * IAM User configuration
 */
export interface IamUserConfig extends BaseIamConfig {
  /** User name */
  name: pulumi.Input<string>;

  /** Whether to force destroy user (removes access keys, etc.) */
  forceDestroy?: boolean;

  /** Managed policy ARNs to attach */
  managedPolicyArns?: pulumi.Input<string>[];

  /** Inline policies to attach */
  inlinePolicies?: {
    name: string;
    policy: PolicyDocument | pulumi.Input<string>;
  }[];

  /** Groups to add user to */
  groups?: pulumi.Input<string>[];

  /** Permissions boundary policy ARN */
  permissionsBoundary?: pulumi.Input<string>;
}

/**
 * IAM Group configuration
 */
export interface IamGroupConfig extends BaseIamConfig {
  /** Group name */
  name: pulumi.Input<string>;

  /** Managed policy ARNs to attach */
  managedPolicyArns?: pulumi.Input<string>[];

  /** Inline policies to attach */
  inlinePolicies?: {
    name: string;
    policy: PolicyDocument | pulumi.Input<string>;
  }[];
}

/**
 * Service-specific role configurations
 */
export interface ServiceRoleConfig {
  /** EC2 service role */
  ec2?: {
    /** Additional managed policies */
    additionalPolicies?: string[];
    /** Custom inline policies */
    customPolicies?: { name: string; policy: PolicyDocument }[];
  };

  /** Lambda service role */
  lambda?: {
    /** VPC access required */
    vpcAccess?: boolean;
    /** Additional managed policies */
    additionalPolicies?: string[];
    /** Custom inline policies */
    customPolicies?: { name: string; policy: PolicyDocument }[];
  };

  /** ECS task role */
  ecsTask?: {
    /** Additional managed policies */
    additionalPolicies?: string[];
    /** Custom inline policies */
    customPolicies?: { name: string; policy: PolicyDocument }[];
  };

  /** ECS execution role */
  ecsExecution?: {
    /** Custom log group ARNs */
    logGroups?: string[];
    /** Additional managed policies */
    additionalPolicies?: string[];
  };
}

/**
 * Cross-account access configuration
 */
export interface CrossAccountConfig {
  /** Trusted account IDs */
  trustedAccounts: string[];

  /** External ID for additional security */
  externalId?: string;

  /** Require MFA */
  requireMfa?: boolean;

  /** Allowed actions */
  allowedActions?: string[];

  /** Allowed resources */
  allowedResources?: string[];

  /** Session duration in seconds */
  sessionDuration?: number;
}

/**
 * Main IAM component arguments
 */
export interface IamArgs {
  /** Component name */
  name: string;

  /** IAM roles to create */
  roles?: IamRoleConfig[];

  /** IAM policies to create */
  policies?: IamPolicyConfig[];

  /** IAM users to create (discouraged - prefer roles) */
  users?: IamUserConfig[];

  /** IAM groups to create */
  groups?: IamGroupConfig[];

  /** Pre-configured service roles */
  serviceRoles?: ServiceRoleConfig;

  /** Cross-account access configuration */
  crossAccountAccess?: CrossAccountConfig;

  /** Global tags to apply to all resources */
  tags?: Record<string, pulumi.Input<string>>;
}

/**
 * IAM component outputs
 */
export interface IamOutputs {
  /** Created IAM roles */
  roles?: { [key: string]: aws.iam.Role };

  /** Created IAM policies */
  policies?: { [key: string]: aws.iam.Policy };

  /** Created IAM users */
  users?: { [key: string]: aws.iam.User };

  /** Created IAM groups */
  groups?: { [key: string]: aws.iam.Group };

  /** Created instance profiles */
  instanceProfiles?: { [key: string]: aws.iam.InstanceProfile };

  /** Role ARNs for easy reference */
  roleArns: { [key: string]: pulumi.Output<string> };

  /** Policy ARNs for easy reference */
  policyArns: { [key: string]: pulumi.Output<string> };
}

/**
 * Common AWS service principals
 */
export const SERVICE_PRINCIPALS = {
  EC2: 'ec2.amazonaws.com',
  LAMBDA: 'lambda.amazonaws.com',
  ECS_TASKS: 'ecs-tasks.amazonaws.com',
  API_GATEWAY: 'apigateway.amazonaws.com',
  CLOUDFORMATION: 'cloudformation.amazonaws.com',
  CODEBUILD: 'codebuild.amazonaws.com',
  CODEPIPELINE: 'codepipeline.amazonaws.com',
  EVENTS: 'events.amazonaws.com',
  S3: 's3.amazonaws.com',
  SNS: 'sns.amazonaws.com',
  SQS: 'sqs.amazonaws.com',
  STEP_FUNCTIONS: 'states.amazonaws.com',
  GLUE: 'glue.amazonaws.com',
  KINESIS: 'kinesis.amazonaws.com',
  FIREHOSE: 'firehose.amazonaws.com',
  RDS: 'rds.amazonaws.com',
  REDSHIFT: 'redshift.amazonaws.com',
} as const;

/**
 * Common AWS managed policy ARNs
 */
export const MANAGED_POLICIES = {
  // EC2 related
  EC2_READ_ONLY: 'arn:aws:iam::aws:policy/AmazonEC2ReadOnlyAccess',
  EC2_INSTANCE_PROFILE: 'arn:aws:iam::aws:policy/service-role/AmazonEC2RoleforSSM',

  // Lambda related
  LAMBDA_BASIC_EXECUTION: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
  LAMBDA_VPC_EXECUTION: 'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',

  // ECS related
  ECS_TASK_EXECUTION: 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
  ECS_TASK_ROLE: 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskRolePolicy',

  // S3 related
  S3_READ_ONLY: 'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess',
  S3_FULL_ACCESS: 'arn:aws:iam::aws:policy/AmazonS3FullAccess',

  // CloudWatch related
  CLOUDWATCH_READ_ONLY: 'arn:aws:iam::aws:policy/CloudWatchReadOnlyAccess',
  CLOUDWATCH_AGENT_SERVER: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',

  // Systems Manager
  SSM_MANAGED_INSTANCE: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',

  // Security
  READ_ONLY_ACCESS: 'arn:aws:iam::aws:policy/ReadOnlyAccess',
  POWER_USER_ACCESS: 'arn:aws:iam::aws:policy/PowerUserAccess',
} as const;
