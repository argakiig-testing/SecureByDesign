/**
 * Custom Policies Example
 *
 * Demonstrates creating custom IAM policies with advanced configurations
 */

import { IamComponent } from 'modular-pulumi-aws-framework';

// Create custom IAM policies and roles with advanced configurations
const customPolicies = new IamComponent('custom-policies', {
  name: 'custom-policies',

  // Create custom policies first
  policies: [
    {
      name: 'application-s3-policy',
      description: 'Custom S3 access policy for application data',
      policy: {
        version: '2012-10-17',
        statements: [
          {
            sid: 'AllowListBucket',
            effect: 'Allow',
            actions: ['s3:ListBucket'],
            resources: ['arn:aws:s3:::my-app-data-bucket'],
            conditions: {
              StringLike: {
                's3:prefix': ['app-data/*', 'logs/*'],
              },
            },
          },
          {
            sid: 'AllowObjectAccess',
            effect: 'Allow',
            actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
            resources: [
              'arn:aws:s3:::my-app-data-bucket/app-data/*',
              'arn:aws:s3:::my-app-data-bucket/logs/*',
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
            sid: 'DenyInsecureAccess',
            effect: 'Deny',
            actions: ['s3:*'],
            resources: ['arn:aws:s3:::my-app-data-bucket', 'arn:aws:s3:::my-app-data-bucket/*'],
            conditions: {
              Bool: {
                'aws:SecureTransport': 'false',
              },
            },
          },
        ],
      },
      tags: {
        Purpose: 'ApplicationDataAccess',
        SecurityLevel: 'High',
      },
    },
    {
      name: 'database-access-policy',
      description: 'Custom database access policy with time restrictions',
      policy: {
        version: '2012-10-17',
        statements: [
          {
            sid: 'AllowRDSAccess',
            effect: 'Allow',
            actions: ['rds:DescribeDBInstances', 'rds:DescribeDBClusters', 'rds-db:connect'],
            resources: [
              'arn:aws:rds-db:*:*:dbuser:*/app-user',
              'arn:aws:rds:*:*:db:production-*',
              'arn:aws:rds:*:*:cluster:production-*',
            ],
            conditions: {
              DateGreaterThan: {
                'aws:CurrentTime': '08:00Z',
              },
              DateLessThan: {
                'aws:CurrentTime': '18:00Z',
              },
              IpAddress: {
                'aws:SourceIp': ['10.0.0.0/8', '172.16.0.0/12'],
              },
            },
          },
          {
            sid: 'AllowSecretsManagerAccess',
            effect: 'Allow',
            actions: ['secretsmanager:GetSecretValue', 'secretsmanager:DescribeSecret'],
            resources: ['arn:aws:secretsmanager:*:*:secret:database/production/*'],
          },
        ],
      },
      tags: {
        Purpose: 'DatabaseAccess',
        TimeRestricted: 'true',
      },
    },
    {
      name: 'monitoring-policy',
      description: 'Custom monitoring and alerting policy',
      policy: {
        version: '2012-10-17',
        statements: [
          {
            sid: 'AllowCloudWatchAccess',
            effect: 'Allow',
            actions: [
              'cloudwatch:GetMetricStatistics',
              'cloudwatch:ListMetrics',
              'cloudwatch:PutMetricData',
              'cloudwatch:GetMetricData',
            ],
            resources: ['*'],
          },
          {
            sid: 'AllowLogsAccess',
            effect: 'Allow',
            actions: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogGroups',
              'logs:DescribeLogStreams',
            ],
            resources: [
              'arn:aws:logs:*:*:log-group:/application/*',
              'arn:aws:logs:*:*:log-group:/monitoring/*',
            ],
          },
          {
            sid: 'AllowSNSPublish',
            effect: 'Allow',
            actions: ['sns:Publish'],
            resources: ['arn:aws:sns:*:*:alerts-*', 'arn:aws:sns:*:*:notifications-*'],
          },
        ],
      },
      tags: {
        Purpose: 'MonitoringAndAlerting',
        Critical: 'true',
      },
    },
  ],

  // Create roles that use the custom policies
  roles: [
    {
      name: 'application-service-role',
      description: 'Service role for application with custom policies',
      trustPolicy: {
        services: ['ecs-tasks.amazonaws.com'],
        maxSessionDuration: 3600,
      },
      managedPolicyArns: [
        // Reference the custom policies created above
        // Note: In real usage, you'd use the policy ARNs from the component
      ],
      inlinePolicies: [
        {
          name: 'DynamoDBAccess',
          policy: {
            version: '2012-10-17',
            statements: [
              {
                effect: 'Allow',
                actions: [
                  'dynamodb:GetItem',
                  'dynamodb:PutItem',
                  'dynamodb:UpdateItem',
                  'dynamodb:DeleteItem',
                  'dynamodb:Query',
                  'dynamodb:Scan',
                ],
                resources: ['arn:aws:dynamodb:*:*:table/application-*'],
                conditions: {
                  'ForAllValues:StringEquals': {
                    'dynamodb:Attributes': ['id', 'data', 'timestamp', 'status'],
                  },
                },
              },
            ],
          },
        },
      ],
      tags: {
        Application: 'MyApp',
        Environment: 'production',
      },
    },
    {
      name: 'data-analyst-role',
      description: 'Role for data analysts with time and IP restrictions',
      trustPolicy: {
        accounts: ['123456789012'],
        requireMfa: true,
        maxSessionDuration: 7200, // 2 hours
      },
      inlinePolicies: [
        {
          name: 'DataAnalystAccess',
          policy: {
            version: '2012-10-17',
            statements: [
              {
                effect: 'Allow',
                actions: ['s3:GetObject', 's3:ListBucket'],
                resources: [
                  'arn:aws:s3:::data-lake-bucket',
                  'arn:aws:s3:::data-lake-bucket/analytics/*',
                ],
                conditions: {
                  DateGreaterThan: {
                    'aws:CurrentTime': '09:00Z',
                  },
                  DateLessThan: {
                    'aws:CurrentTime': '17:00Z',
                  },
                  IpAddress: {
                    'aws:SourceIp': ['203.0.113.0/24'], // Office IP range
                  },
                  Bool: {
                    'aws:MultiFactorAuthPresent': 'true',
                  },
                },
              },
              {
                effect: 'Allow',
                actions: [
                  'athena:StartQueryExecution',
                  'athena:GetQueryExecution',
                  'athena:GetQueryResults',
                  'athena:ListQueryExecutions',
                ],
                resources: ['arn:aws:athena:*:*:workgroup/analytics'],
              },
              {
                effect: 'Deny',
                actions: ['*'],
                resources: ['*'],
                conditions: {
                  DateLessThan: {
                    'aws:CurrentTime': '09:00Z',
                  },
                },
              },
              {
                effect: 'Deny',
                actions: ['*'],
                resources: ['*'],
                conditions: {
                  DateGreaterThan: {
                    'aws:CurrentTime': '17:00Z',
                  },
                },
              },
            ],
          },
        },
      ],
      tags: {
        Purpose: 'DataAnalysis',
        TimeRestricted: 'true',
        MFARequired: 'true',
      },
    },
    {
      name: 'emergency-access-role',
      description: 'Emergency break-glass role with comprehensive access',
      trustPolicy: {
        accounts: ['123456789012'],
        requireMfa: true,
        externalId: 'emergency-break-glass-2024',
        maxSessionDuration: 3600, // 1 hour maximum
      },
      managedPolicyArns: ['arn:aws:iam::aws:policy/PowerUserAccess'],
      inlinePolicies: [
        {
          name: 'EmergencyIAMAccess',
          policy: {
            version: '2012-10-17',
            statements: [
              {
                sid: 'AllowEmergencyIAMAccess',
                effect: 'Allow',
                actions: [
                  'iam:AttachRolePolicy',
                  'iam:DetachRolePolicy',
                  'iam:CreateRole',
                  'iam:DeleteRole',
                  'iam:PutRolePolicy',
                  'iam:DeleteRolePolicy',
                ],
                resources: ['arn:aws:iam::*:role/Emergency-*'],
                conditions: {
                  StringEquals: {
                    'aws:RequestedRegion': ['us-east-1', 'us-west-2'],
                  },
                  Bool: {
                    'aws:MultiFactorAuthPresent': 'true',
                  },
                },
              },
              {
                sid: 'DenyDangerousActions',
                effect: 'Deny',
                actions: [
                  'iam:DeleteUser',
                  'iam:DeleteGroup',
                  'iam:DeleteRole',
                  'organizations:*',
                  'account:*',
                ],
                resources: ['*'],
                conditions: {
                  StringNotEquals: {
                    'aws:userid': 'AIDACKCEVSQ6C2EXAMPLE', // Specific emergency user
                  },
                },
              },
            ],
          },
        },
      ],
      tags: {
        Purpose: 'EmergencyAccess',
        Critical: 'true',
        AuditRequired: 'true',
      },
    },
  ],

  // Global tags for all resources
  tags: {
    Project: 'CustomPoliciesExample',
    ManagedBy: 'Pulumi',
    SecurityCompliance: 'required',
    Environment: 'production',
  },
});

// Export policy ARNs for reference
export const policyArns = customPolicies.policyArns;

// Export role ARNs for use with other resources
export const roleArns = customPolicies.roleArns;

// Export specific role ARNs for convenience
export const applicationServiceRoleArn = customPolicies.roleArns['application-service-role'];
export const dataAnalystRoleArn = customPolicies.roleArns['data-analyst-role'];
export const emergencyAccessRoleArn = customPolicies.roleArns['emergency-access-role'];

// Grant additional permissions to existing roles
customPolicies.grantS3Access('application-service-role', 'arn:aws:s3:::my-app-data-bucket', 'full');
customPolicies.grantCloudWatchLogsAccess(
  'application-service-role',
  'arn:aws:logs:*:*:log-group:/application/my-app'
);
customPolicies.grantSecretsManagerAccess(
  'application-service-role',
  'arn:aws:secretsmanager:*:*:secret:app/database/*'
);

// Export the component for further customization
export { customPolicies };

// Policy best practices documentation
export const policyBestPractices = {
  principleOfLeastPrivilege: 'Grant only the minimum permissions required for the task',
  useConditions: 'Use policy conditions to restrict access based on time, IP, MFA, etc.',
  explicitDeny: 'Use explicit deny statements for security-critical restrictions',
  regularReview: 'Regularly review and audit policy permissions',
  versionControl: 'Keep policy documents in version control',
  testing: 'Test policies in a non-production environment first',
  monitoring: 'Monitor policy usage with CloudTrail and Access Analyzer',
};
