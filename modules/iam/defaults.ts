/**
 * IAM Module Secure Defaults
 *
 * Security-first defaults for Identity and Access Management
 */

import {
  PolicyDocument,
  PolicyStatement,
  TrustPolicyConfig,
  SERVICE_PRINCIPALS,
  MANAGED_POLICIES,
} from './types';

/**
 * Default IAM configuration values
 */
export const IAM_DEFAULTS = {
  /** Default path for IAM resources */
  path: '/',

  /** Default maximum session duration (4 hours) */
  maxSessionDuration: 14400,

  /** Default tags applied to all IAM resources */
  tags: {
    ManagedBy: 'SecureByDesign',
    Component: 'IAM',
    SecurityLevel: 'high',
    Compliance: 'required',
  },

  /** Force detach policies when destroying roles */
  forceDetachPolicies: true,

  /** Default trust policy settings */
  trustPolicy: {
    requireMfa: false,
    maxSessionDuration: 14400,
  },

  /** Common secure conditions */
  secureConditions: {
    /** Require SSL/TLS */
    requireSsl: {
      Bool: {
        'aws:SecureTransport': 'true',
      },
    },

    /** Require MFA */
    requireMfa: {
      Bool: {
        'aws:MultiFactorAuthPresent': 'true',
      },
    },

    /** Limit to specific IP ranges */
    restrictIpRange: (cidrs: string[]) => ({
      IpAddress: {
        'aws:SourceIp': cidrs,
      },
    }),

    /** Time-based access restrictions */
    timeRestriction: (startTime: string, endTime: string) => ({
      DateGreaterThan: {
        'aws:CurrentTime': startTime,
      },
      DateLessThan: {
        'aws:CurrentTime': endTime,
      },
    }),
  },
} as const;

/**
 * Creates a secure trust policy document
 */
export function createTrustPolicy(config: TrustPolicyConfig): PolicyDocument {
  const statements: PolicyStatement[] = [];

  // Service principals
  if (config.services && config.services.length > 0) {
    const statement: PolicyStatement = {
      effect: 'Allow',
      actions: 'sts:AssumeRole',
      principals: [
        {
          type: 'Service',
          identifiers: config.services,
        },
      ],
    };

    // Add conditions if specified
    if (config.requireMfa || config.externalId) {
      statement.conditions = {};

      if (config.requireMfa) {
        statement.conditions.Bool = {
          'aws:MultiFactorAuthPresent': 'true',
        };
      }

      if (config.externalId) {
        statement.conditions.StringEquals = {
          'sts:ExternalId': config.externalId,
        };
      }
    }

    statements.push(statement);
  }

  // AWS account principals
  if (config.accounts && config.accounts.length > 0) {
    const accountPrincipals = config.accounts.map(account =>
      account.startsWith('arn:') ? account : `arn:aws:iam::${account}:root`
    );

    const statement: PolicyStatement = {
      effect: 'Allow',
      actions: 'sts:AssumeRole',
      principals: [
        {
          type: 'AWS',
          identifiers: accountPrincipals,
        },
      ],
    };

    // Add conditions for cross-account access
    if (config.requireMfa || config.externalId) {
      statement.conditions = {};

      if (config.requireMfa) {
        statement.conditions.Bool = {
          'aws:MultiFactorAuthPresent': 'true',
        };
      }

      if (config.externalId) {
        statement.conditions.StringEquals = {
          'sts:ExternalId': config.externalId,
        };
      }
    }

    statements.push(statement);
  }

  // Federated principals
  if (config.federatedProviders && config.federatedProviders.length > 0) {
    statements.push({
      effect: 'Allow',
      actions: 'sts:AssumeRoleWithWebIdentity',
      principals: [
        {
          type: 'Federated',
          identifiers: config.federatedProviders,
        },
      ],
    });
  }

  // SAML principals
  if (config.samlProviders && config.samlProviders.length > 0) {
    statements.push({
      effect: 'Allow',
      actions: 'sts:AssumeRoleWithSAML',
      principals: [
        {
          type: 'Federated',
          identifiers: config.samlProviders,
        },
      ],
    });
  }

  // OIDC principals
  if (config.oidcProviders && config.oidcProviders.length > 0) {
    statements.push({
      effect: 'Allow',
      actions: 'sts:AssumeRoleWithWebIdentity',
      principals: [
        {
          type: 'Federated',
          identifiers: config.oidcProviders,
        },
      ],
    });
  }

  // Custom statements
  if (config.customStatements) {
    statements.push(...config.customStatements);
  }

  return {
    version: '2012-10-17',
    statements,
  };
}

/**
 * Converts PolicyDocument to JSON string
 */
export function policyDocumentToJson(doc: PolicyDocument): string {
  const awsDoc = {
    Version: doc.version,
    Statement: doc.statements.map(stmt => {
      const awsStmt: any = {
        Effect: stmt.effect,
      };

      if (stmt.sid) awsStmt.Sid = stmt.sid;

      // Handle actions
      if (Array.isArray(stmt.actions)) {
        awsStmt.Action = stmt.actions;
      } else {
        awsStmt.Action = stmt.actions;
      }

      // Handle resources
      if (stmt.resources) {
        if (Array.isArray(stmt.resources)) {
          awsStmt.Resource = stmt.resources;
        } else {
          awsStmt.Resource = stmt.resources;
        }
      }

      // Handle principals
      if (stmt.principals) {
        const principals: any = {};
        stmt.principals.forEach(principal => {
          if (Array.isArray(principal.identifiers)) {
            principals[principal.type] = principal.identifiers;
          } else {
            principals[principal.type] = principal.identifiers;
          }
        });
        awsStmt.Principal = principals;
      }

      // Handle conditions
      if (stmt.conditions) {
        awsStmt.Condition = stmt.conditions;
      }

      // Handle not actions
      if (stmt.notActions) {
        awsStmt.NotAction = stmt.notActions;
      }

      // Handle not resources
      if (stmt.notResources) {
        awsStmt.NotResource = stmt.notResources;
      }

      // Handle not principals
      if (stmt.notPrincipals) {
        const notPrincipals: any = {};
        stmt.notPrincipals.forEach(principal => {
          if (Array.isArray(principal.identifiers)) {
            notPrincipals[principal.type] = principal.identifiers;
          } else {
            notPrincipals[principal.type] = principal.identifiers;
          }
        });
        awsStmt.NotPrincipal = notPrincipals;
      }

      return awsStmt;
    }),
  };

  return JSON.stringify(awsDoc, null, 2);
}

/**
 * Pre-configured service role trust policies
 */
export const SERVICE_ROLE_TRUST_POLICIES = {
  /** EC2 service role trust policy */
  ec2: (): TrustPolicyConfig => ({
    services: [SERVICE_PRINCIPALS.EC2],
    maxSessionDuration: 3600, // 1 hour
  }),

  /** Lambda service role trust policy */
  lambda: (): TrustPolicyConfig => ({
    services: [SERVICE_PRINCIPALS.LAMBDA],
    maxSessionDuration: 3600, // 1 hour
  }),

  /** ECS task role trust policy */
  ecsTask: (): TrustPolicyConfig => ({
    services: [SERVICE_PRINCIPALS.ECS_TASKS],
    maxSessionDuration: 3600, // 1 hour
  }),

  /** API Gateway service role trust policy */
  apiGateway: (): TrustPolicyConfig => ({
    services: [SERVICE_PRINCIPALS.API_GATEWAY],
    maxSessionDuration: 3600, // 1 hour
  }),

  /** CodeBuild service role trust policy */
  codeBuild: (): TrustPolicyConfig => ({
    services: [SERVICE_PRINCIPALS.CODEBUILD],
    maxSessionDuration: 3600, // 1 hour
  }),

  /** Step Functions service role trust policy */
  stepFunctions: (): TrustPolicyConfig => ({
    services: [SERVICE_PRINCIPALS.STEP_FUNCTIONS],
    maxSessionDuration: 3600, // 1 hour
  }),

  /** Cross-account access trust policy */
  crossAccount: (
    trustedAccounts: string[],
    externalId?: string,
    requireMfa = true
  ): TrustPolicyConfig => ({
    accounts: trustedAccounts,
    ...(externalId && { externalId }),
    requireMfa,
    maxSessionDuration: 3600, // 1 hour for cross-account
  }),
} as const;

/**
 * Common secure policy documents
 */
export const COMMON_POLICIES = {
  /** Deny all policy (for testing/emergency) */
  denyAll: (): PolicyDocument => ({
    version: '2012-10-17',
    statements: [
      {
        effect: 'Deny',
        actions: '*',
        resources: '*',
      },
    ],
  }),

  /** Read-only S3 access to specific bucket */
  s3ReadOnly: (bucketArn: string): PolicyDocument => ({
    version: '2012-10-17',
    statements: [
      {
        effect: 'Allow',
        actions: ['s3:GetObject', 's3:GetObjectVersion', 's3:ListBucket'],
        resources: [bucketArn, `${bucketArn}/*`],
        conditions: IAM_DEFAULTS.secureConditions.requireSsl,
      },
    ],
  }),

  /** CloudWatch logs write access */
  cloudWatchLogsWrite: (logGroupArn?: string): PolicyDocument => ({
    version: '2012-10-17',
    statements: [
      {
        effect: 'Allow',
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:DescribeLogStreams',
        ],
        resources: logGroupArn ? [logGroupArn] : ['arn:aws:logs:*:*:*'],
      },
    ],
  }),

  /** EC2 describe permissions (for service discovery) */
  ec2Describe: (): PolicyDocument => ({
    version: '2012-10-17',
    statements: [
      {
        effect: 'Allow',
        actions: [
          'ec2:DescribeInstances',
          'ec2:DescribeInstanceStatus',
          'ec2:DescribeTags',
          'ec2:DescribeSecurityGroups',
          'ec2:DescribeSubnets',
          'ec2:DescribeVpcs',
        ],
        resources: '*',
      },
    ],
  }),

  /** Secrets Manager read access */
  secretsManagerRead: (secretArn: string): PolicyDocument => ({
    version: '2012-10-17',
    statements: [
      {
        effect: 'Allow',
        actions: ['secretsmanager:GetSecretValue', 'secretsmanager:DescribeSecret'],
        resources: [secretArn],
      },
    ],
  }),

  /** Parameter Store read access */
  parameterStoreRead: (parameterPath: string): PolicyDocument => ({
    version: '2012-10-17',
    statements: [
      {
        effect: 'Allow',
        actions: ['ssm:GetParameter', 'ssm:GetParameters', 'ssm:GetParametersByPath'],
        resources: [`arn:aws:ssm:*:*:parameter${parameterPath}`],
      },
    ],
  }),

  /** KMS decrypt access */
  kmsDecrypt: (keyArn: string): PolicyDocument => ({
    version: '2012-10-17',
    statements: [
      {
        effect: 'Allow',
        actions: ['kms:Decrypt', 'kms:DescribeKey'],
        resources: [keyArn],
      },
    ],
  }),
} as const;

/**
 * Pre-configured service role configurations
 */
export const SERVICE_ROLE_CONFIGS = {
  /** EC2 instance role with SSM access */
  ec2Instance: () => ({
    trustPolicy: SERVICE_ROLE_TRUST_POLICIES.ec2(),
    managedPolicyArns: [
      MANAGED_POLICIES.SSM_MANAGED_INSTANCE,
      MANAGED_POLICIES.CLOUDWATCH_AGENT_SERVER,
    ],
    createInstanceProfile: true,
  }),

  /** Lambda execution role with basic permissions */
  lambdaBasic: () => ({
    trustPolicy: SERVICE_ROLE_TRUST_POLICIES.lambda(),
    managedPolicyArns: [MANAGED_POLICIES.LAMBDA_BASIC_EXECUTION],
  }),

  /** Lambda execution role with VPC access */
  lambdaVpc: () => ({
    trustPolicy: SERVICE_ROLE_TRUST_POLICIES.lambda(),
    managedPolicyArns: [MANAGED_POLICIES.LAMBDA_VPC_EXECUTION],
  }),

  /** ECS task execution role */
  ecsTaskExecution: (logGroupArns?: string[]) => ({
    trustPolicy: SERVICE_ROLE_TRUST_POLICIES.ecsTask(),
    managedPolicyArns: [MANAGED_POLICIES.ECS_TASK_EXECUTION],
    ...(logGroupArns && {
      inlinePolicies: [
        {
          name: 'CustomLogAccess',
          policy: COMMON_POLICIES.cloudWatchLogsWrite(logGroupArns.join(',')),
        },
      ],
    }),
  }),

  /** ECS task role (for application permissions) */
  ecsTask: () => ({
    trustPolicy: SERVICE_ROLE_TRUST_POLICIES.ecsTask(),
    managedPolicyArns: [MANAGED_POLICIES.ECS_TASK_ROLE],
  }),
} as const;

/**
 * Validates IAM role name
 */
export function validateRoleName(name: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Length check
  if (name.length < 1 || name.length > 64) {
    errors.push('Role name must be between 1 and 64 characters');
  }

  // Character validation
  const validPattern = /^[a-zA-Z0-9+=,.@\-_]+$/;
  if (!validPattern.test(name)) {
    errors.push('Role name can only contain alphanumeric characters and +=,.@-_');
  }

  // Path validation (if path is included in name)
  if (name.includes('/')) {
    const pathPattern = /^\/[a-zA-Z0-9+=,.@\-_/]*\/[a-zA-Z0-9+=,.@\-_]+$/;
    if (!pathPattern.test(name)) {
      errors.push('Invalid path format in role name');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates IAM policy name
 */
export function validatePolicyName(name: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Length check
  if (name.length < 1 || name.length > 128) {
    errors.push('Policy name must be between 1 and 128 characters');
  }

  // Character validation
  const validPattern = /^[a-zA-Z0-9+=,.@\-_]+$/;
  if (!validPattern.test(name)) {
    errors.push('Policy name can only contain alphanumeric characters and +=,.@-_');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generates secure IAM resource names
 */
export function generateSecureResourceName(
  baseName: string,
  resourceType: 'role' | 'policy' | 'user' | 'group'
): string {
  // Add timestamp for uniqueness
  const timestamp = Date.now().toString(36);

  // Sanitize base name
  const sanitized = baseName.replace(/[^a-zA-Z0-9\-_]/g, '-');

  // Create name with type prefix and timestamp
  const name = `${resourceType}-${sanitized}-${timestamp}`;

  // Ensure name meets AWS requirements
  const maxLength = resourceType === 'policy' ? 128 : 64;
  return name.length > maxLength ? name.substring(0, maxLength) : name;
}
