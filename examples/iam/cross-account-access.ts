/**
 * Cross-Account Access Example
 *
 * Demonstrates secure cross-account IAM role configuration with MFA and external ID
 */

import { IamComponent } from 'modular-pulumi-aws-framework';

// Create cross-account access roles with security best practices
const crossAccountAccess = new IamComponent('cross-account-access', {
  name: 'cross-account-access',

  // Configure cross-account access with security controls
  crossAccountAccess: {
    // Trusted account IDs that can assume this role
    trustedAccounts: [
      '123456789012', // Production account
      '123456789013', // Staging account
    ],

    // External ID for additional security (share this securely with trusted accounts)
    externalId: 'unique-external-id-12345',

    // Require MFA for additional security
    requireMfa: true,

    // Limit session duration to 1 hour
    sessionDuration: 3600,

    // Specific actions allowed for cross-account access
    allowedActions: [
      's3:GetObject',
      's3:PutObject',
      's3:ListBucket',
      'cloudwatch:GetMetricStatistics',
      'cloudwatch:ListMetrics',
      'logs:DescribeLogGroups',
      'logs:DescribeLogStreams',
      'logs:GetLogEvents',
    ],

    // Specific resources the cross-account role can access
    allowedResources: [
      'arn:aws:s3:::shared-data-bucket',
      'arn:aws:s3:::shared-data-bucket/*',
      'arn:aws:logs:*:*:log-group:/shared/*',
      'arn:aws:cloudwatch:*:*:metric/AWS/*',
    ],
  },

  // Additional manual cross-account roles for specific use cases
  roles: [
    {
      name: 'read-only-cross-account',
      description: 'Read-only access for external auditing',
      trustPolicy: {
        accounts: ['123456789014'], // Audit account
        externalId: 'audit-external-id-67890',
        requireMfa: true,
        maxSessionDuration: 7200, // 2 hours for auditing
      },
      managedPolicyArns: [
        'arn:aws:iam::aws:policy/ReadOnlyAccess',
        'arn:aws:iam::aws:policy/SecurityAudit',
      ],
      inlinePolicies: [
        {
          name: 'AuditSpecificAccess',
          policy: {
            version: '2012-10-17',
            statements: [
              {
                effect: 'Allow',
                actions: [
                  'iam:GenerateCredentialReport',
                  'iam:GetCredentialReport',
                  'iam:ListUsers',
                  'iam:ListRoles',
                  'iam:ListPolicies',
                ],
                resources: ['*'],
              },
              {
                effect: 'Allow',
                actions: [
                  'config:GetComplianceDetailsByConfigRule',
                  'config:GetComplianceDetailsByResource',
                  'config:GetComplianceSummaryByConfigRule',
                  'config:GetComplianceSummaryByResourceType',
                ],
                resources: ['*'],
              },
            ],
          },
        },
      ],
      tags: {
        Purpose: 'ExternalAudit',
        Auditor: 'ThirdParty',
      },
    },
    {
      name: 'backup-cross-account',
      description: 'Cross-account access for backup services',
      trustPolicy: {
        accounts: ['123456789015'], // Backup account
        externalId: 'backup-external-id-11111',
        requireMfa: false, // Automated backup service
        maxSessionDuration: 3600,
      },
      inlinePolicies: [
        {
          name: 'BackupPermissions',
          policy: {
            version: '2012-10-17',
            statements: [
              {
                effect: 'Allow',
                actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject', 's3:ListBucket'],
                resources: [
                  'arn:aws:s3:::backup-destination-bucket',
                  'arn:aws:s3:::backup-destination-bucket/*',
                ],
                conditions: {
                  Bool: {
                    'aws:SecureTransport': 'true',
                  },
                  StringEquals: {
                    's3:x-amz-server-side-encryption': 'AES256',
                  },
                },
              },
              {
                effect: 'Allow',
                actions: ['rds:CreateDBSnapshot', 'rds:DescribeDBSnapshots', 'rds:CopyDBSnapshot'],
                resources: ['arn:aws:rds:*:*:snapshot:backup-*', 'arn:aws:rds:*:*:db:production-*'],
              },
            ],
          },
        },
      ],
      tags: {
        Purpose: 'CrossAccountBackup',
        BackupProvider: 'ExternalService',
      },
    },
    {
      name: 'monitoring-cross-account',
      description: 'Cross-account access for monitoring services',
      trustPolicy: {
        accounts: ['123456789016'], // Monitoring account
        externalId: 'monitoring-external-id-22222',
        requireMfa: false, // Automated monitoring
        maxSessionDuration: 3600,
      },
      inlinePolicies: [
        {
          name: 'MonitoringPermissions',
          policy: {
            version: '2012-10-17',
            statements: [
              {
                effect: 'Allow',
                actions: [
                  'cloudwatch:GetMetricStatistics',
                  'cloudwatch:ListMetrics',
                  'cloudwatch:GetMetricData',
                  'cloudwatch:DescribeAlarms',
                ],
                resources: ['*'],
              },
              {
                effect: 'Allow',
                actions: [
                  'logs:DescribeLogGroups',
                  'logs:DescribeLogStreams',
                  'logs:GetLogEvents',
                  'logs:FilterLogEvents',
                ],
                resources: [
                  'arn:aws:logs:*:*:log-group:/aws/*',
                  'arn:aws:logs:*:*:log-group:/application/*',
                ],
              },
              {
                effect: 'Allow',
                actions: [
                  'ec2:DescribeInstances',
                  'ec2:DescribeInstanceStatus',
                  'ecs:DescribeServices',
                  'ecs:DescribeTasks',
                  'lambda:ListFunctions',
                  'lambda:GetFunction',
                ],
                resources: ['*'],
              },
            ],
          },
        },
      ],
      tags: {
        Purpose: 'CrossAccountMonitoring',
        MonitoringProvider: 'ExternalService',
      },
    },
  ],

  // Global tags for all cross-account resources
  tags: {
    Project: 'CrossAccountExample',
    ManagedBy: 'Pulumi',
    SecurityLevel: 'high',
    ComplianceRequired: 'true',
  },
});

// Export role ARNs for documentation and external sharing
export const crossAccountRoleArns = {
  // Main cross-account role
  mainCrossAccountRole: crossAccountAccess.roleArns['cross-account-access-cross-account-role'],

  // Specific purpose roles
  readOnlyAuditRole: crossAccountAccess.roleArns['read-only-cross-account'],
  backupRole: crossAccountAccess.roleArns['backup-cross-account'],
  monitoringRole: crossAccountAccess.roleArns['monitoring-cross-account'],
};

// Export trust policy examples for external account configuration
export const trustPolicyExamples = {
  // Example for external accounts to assume the main role
  mainRoleAssumption: {
    roleArn: crossAccountRoleArns.mainCrossAccountRole,
    externalId: 'unique-external-id-12345',
    requireMfa: true,
    sessionDuration: 3600,
    // AWS CLI example:
    // aws sts assume-role --role-arn <role-arn> --role-session-name "CrossAccountSession" --external-id "unique-external-id-12345" --serial-number <mfa-device> --token-code <mfa-code>
  },

  // Example for audit account
  auditRoleAssumption: {
    roleArn: crossAccountRoleArns.readOnlyAuditRole,
    externalId: 'audit-external-id-67890',
    requireMfa: true,
    sessionDuration: 7200,
  },

  // Example for backup service
  backupRoleAssumption: {
    roleArn: crossAccountRoleArns.backupRole,
    externalId: 'backup-external-id-11111',
    requireMfa: false,
    sessionDuration: 3600,
  },

  // Example for monitoring service
  monitoringRoleAssumption: {
    roleArn: crossAccountRoleArns.monitoringRole,
    externalId: 'monitoring-external-id-22222',
    requireMfa: false,
    sessionDuration: 3600,
  },
};

// Export the component for further customization
export { crossAccountAccess };

// Security best practices documentation
export const securityBestPractices = {
  externalId: 'Always use a unique, unpredictable external ID for cross-account access',
  mfa: 'Require MFA for human access, optional for automated services',
  sessionDuration: 'Use the shortest session duration that meets your needs',
  principleOfLeastPrivilege: 'Grant only the minimum permissions required',
  monitoring: 'Monitor cross-account role assumptions using CloudTrail',
  rotation: 'Regularly rotate external IDs and review trusted accounts',
};
