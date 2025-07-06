# IAM Module

The IAM (Identity and Access Management) module provides comprehensive, secure-by-default IAM role and policy management for AWS infrastructure. This module follows security best practices and makes it easy to create roles, policies, and permissions with proper guardrails.

## Features

- **Security-First Design**: All configurations default to secure settings
- **Comprehensive Role Types**: Support for service roles, cross-account access, and custom roles
- **Policy Management**: Create and manage both managed and inline policies
- **Pre-configured Templates**: Ready-to-use service role configurations
- **Permission Grants**: Helper methods for common permission patterns
- **Validation**: Built-in validation for role and policy names
- **Trust Policies**: Flexible trust policy configuration with security controls

## Quick Start

```typescript
import { IamComponent } from 'modular-pulumi-aws-framework';

// Create basic service roles
const iam = new IamComponent('my-iam', {
  name: 'my-iam',
  serviceRoles: {
    // EC2 service role with SSM access
    ec2: {
      additionalPolicies: ['arn:aws:iam::aws:policy/ReadOnlyAccess'],
    },
    // Lambda execution role
    lambda: {
      vpcAccess: true,
    },
  },
  tags: {
    Environment: 'production',
  },
});

// Export role ARNs for use with other resources
export const ec2RoleArn = iam.roleArns['my-iam-ec2-role'];
export const lambdaRoleArn = iam.roleArns['my-iam-lambda-role'];
```

## Configuration Options

### Main Configuration (`IamArgs`)

| Property             | Type                            | Description                        |
| -------------------- | ------------------------------- | ---------------------------------- |
| `name`               | `string`                        | Component name (required)          |
| `roles`              | `IamRoleConfig[]`               | Custom IAM roles to create         |
| `policies`           | `IamPolicyConfig[]`             | Custom IAM policies to create      |
| `users`              | `IamUserConfig[]`               | IAM users to create (discouraged)  |
| `groups`             | `IamGroupConfig[]`              | IAM groups to create               |
| `serviceRoles`       | `ServiceRoleConfig`             | Pre-configured service roles       |
| `crossAccountAccess` | `CrossAccountConfig`            | Cross-account access configuration |
| `tags`               | `Record<string, Input<string>>` | Global tags for all resources      |

### Role Configuration (`IamRoleConfig`)

| Property                | Type                            | Description                           |
| ----------------------- | ------------------------------- | ------------------------------------- |
| `name`                  | `Input<string>`                 | Role name (required)                  |
| `trustPolicy`           | `TrustPolicyConfig`             | Trust policy configuration (required) |
| `description`           | `Input<string>`                 | Role description                      |
| `managedPolicyArns`     | `Input<string>[]`               | AWS managed policy ARNs to attach     |
| `inlinePolicies`        | `InlinePolicy[]`                | Custom inline policies                |
| `createInstanceProfile` | `boolean`                       | Create EC2 instance profile           |
| `forceDetachPolicies`   | `boolean`                       | Force detach policies on deletion     |
| `permissionsBoundary`   | `Input<string>`                 | Permissions boundary policy ARN       |
| `path`                  | `Input<string>`                 | IAM path for organization             |
| `tags`                  | `Record<string, Input<string>>` | Resource-specific tags                |

### Trust Policy Configuration (`TrustPolicyConfig`)

| Property             | Type                | Description                                   |
| -------------------- | ------------------- | --------------------------------------------- |
| `services`           | `string[]`          | AWS services that can assume the role         |
| `accounts`           | `string[]`          | AWS account IDs that can assume the role      |
| `federatedProviders` | `string[]`          | Federated identity providers                  |
| `samlProviders`      | `string[]`          | SAML identity providers                       |
| `oidcProviders`      | `string[]`          | OIDC identity providers                       |
| `customStatements`   | `PolicyStatement[]` | Custom trust policy statements                |
| `requireMfa`         | `boolean`           | Require MFA for role assumption               |
| `externalId`         | `string`            | External ID for cross-account access          |
| `maxSessionDuration` | `number`            | Maximum session duration (3600-43200 seconds) |

## Security Best Practices

### 1. Principle of Least Privilege

The module enforces the principle of least privilege by:

- Requiring explicit trust policy configuration
- Providing granular permission controls
- Supporting permissions boundaries
- Offering pre-configured minimal service roles

### 2. Secure Defaults

All configurations include secure defaults:

- Force SSL/TLS for all S3 access
- Require MFA for cross-account access (when enabled)
- Maximum session durations aligned with security best practices
- Comprehensive resource tagging for compliance

### 3. Trust Policy Security

Trust policies support advanced security features:

- External ID for cross-account access
- MFA requirements
- Time-based access restrictions
- IP address restrictions
- Session duration limits

## Service Roles

### Pre-configured Service Roles

The module provides pre-configured roles for common AWS services:

```typescript
const iam = new IamComponent('service-roles', {
  name: 'service-roles',
  serviceRoles: {
    // EC2 instance role with SSM and CloudWatch access
    ec2: {
      additionalPolicies: ['arn:aws:iam::aws:policy/ReadOnlyAccess'],
      customPolicies: [
        {
          name: 'CustomAppAccess',
          policy: {
            version: '2012-10-17',
            statements: [
              {
                effect: 'Allow',
                actions: ['dynamodb:GetItem', 'dynamodb:PutItem'],
                resources: ['arn:aws:dynamodb:*:*:table/MyApp-*'],
              },
            ],
          },
        },
      ],
    },

    // Lambda execution role
    lambda: {
      vpcAccess: true, // Includes VPC execution permissions
      additionalPolicies: ['arn:aws:iam::aws:policy/AmazonRDSReadOnlyAccess'],
    },

    // ECS task and execution roles
    ecsTask: {
      additionalPolicies: ['arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess'],
    },
    ecsExecution: {
      logGroups: ['arn:aws:logs:*:*:log-group:/ecs/my-app'],
    },
  },
});
```

### Included Managed Policies

Each service role includes appropriate managed policies:

- **EC2**: `AmazonSSMManagedInstanceCore`, `CloudWatchAgentServerPolicy`
- **Lambda Basic**: `AWSLambdaBasicExecutionRole`
- **Lambda VPC**: `AWSLambdaVPCAccessExecutionRole`
- **ECS Task Execution**: `AmazonECSTaskExecutionRolePolicy`

## Cross-Account Access

### Secure Cross-Account Configuration

```typescript
const crossAccount = new IamComponent('cross-account', {
  name: 'cross-account',
  crossAccountAccess: {
    trustedAccounts: ['123456789012', '123456789013'],
    externalId: 'unique-external-id-12345',
    requireMfa: true,
    sessionDuration: 3600,
    allowedActions: ['s3:GetObject', 's3:ListBucket', 'cloudwatch:GetMetricStatistics'],
    allowedResources: ['arn:aws:s3:::shared-data-bucket/*', 'arn:aws:cloudwatch:*:*:metric/AWS/*'],
  },
});
```

### Manual Cross-Account Roles

For specific use cases, create manual cross-account roles:

```typescript
const iam = new IamComponent('manual-cross-account', {
  name: 'manual-cross-account',
  roles: [
    {
      name: 'audit-access-role',
      description: 'Cross-account access for security auditing',
      trustPolicy: {
        accounts: ['123456789014'], // Audit account
        externalId: 'audit-external-id',
        requireMfa: true,
        maxSessionDuration: 7200, // 2 hours
      },
      managedPolicyArns: [
        'arn:aws:iam::aws:policy/ReadOnlyAccess',
        'arn:aws:iam::aws:policy/SecurityAudit',
      ],
    },
  ],
});
```

## Custom Policies

### Creating Custom Policies

```typescript
const customPolicies = new IamComponent('custom-policies', {
  name: 'custom-policies',
  policies: [
    {
      name: 'application-s3-policy',
      description: 'Custom S3 access for application',
      policy: {
        version: '2012-10-17',
        statements: [
          {
            sid: 'AllowS3Access',
            effect: 'Allow',
            actions: ['s3:GetObject', 's3:PutObject'],
            resources: ['arn:aws:s3:::my-app-bucket/*'],
            conditions: {
              Bool: { 'aws:SecureTransport': 'true' },
              StringEquals: { 's3:x-amz-server-side-encryption': 'AES256' },
            },
          },
        ],
      },
    },
  ],
});
```

### Policy Conditions

Support for comprehensive policy conditions:

```typescript
// Time-based restrictions
conditions: {
  DateGreaterThan: { 'aws:CurrentTime': '09:00Z' },
  DateLessThan: { 'aws:CurrentTime': '17:00Z' },
}

// IP address restrictions
conditions: {
  IpAddress: { 'aws:SourceIp': ['203.0.113.0/24'] },
}

// MFA requirements
conditions: {
  Bool: { 'aws:MultiFactorAuthPresent': 'true' },
}

// SSL/TLS enforcement
conditions: {
  Bool: { 'aws:SecureTransport': 'true' },
}
```

## Permission Grants

### Helper Methods

The module provides helper methods for common permission patterns:

```typescript
// Grant S3 access
iam.grantS3Access('my-role', 'arn:aws:s3:::my-bucket', 'read'); // 'read' | 'write' | 'full'

// Grant CloudWatch Logs access
iam.grantCloudWatchLogsAccess('my-role', 'arn:aws:logs:*:*:log-group:/my-app');

// Grant Secrets Manager access
iam.grantSecretsManagerAccess('my-role', 'arn:aws:secretsmanager:*:*:secret:my-secret');

// Grant Parameter Store access
iam.grantParameterStoreAccess('my-role', '/app/config');
```

## Common Use Cases

### 1. Application Service Role

```typescript
const appRole = new IamComponent('app-role', {
  name: 'app-role',
  roles: [
    {
      name: 'application-service-role',
      trustPolicy: { services: ['ecs-tasks.amazonaws.com'] },
      managedPolicyArns: ['arn:aws:iam::aws:policy/service-role/AmazonECSTaskRolePolicy'],
      inlinePolicies: [
        {
          name: 'ApplicationPermissions',
          policy: {
            version: '2012-10-17',
            statements: [
              {
                effect: 'Allow',
                actions: [
                  'secretsmanager:GetSecretValue',
                  'ssm:GetParameter',
                  'dynamodb:GetItem',
                  'dynamodb:PutItem',
                ],
                resources: [
                  'arn:aws:secretsmanager:*:*:secret:app/*',
                  'arn:aws:ssm:*:*:parameter/app/*',
                  'arn:aws:dynamodb:*:*:table/app-*',
                ],
              },
            ],
          },
        },
      ],
    },
  ],
});
```

### 2. Data Analytics Role

```typescript
const analyticsRole = new IamComponent('analytics-role', {
  name: 'analytics-role',
  roles: [
    {
      name: 'data-analyst-role',
      trustPolicy: {
        accounts: ['123456789012'],
        requireMfa: true,
        maxSessionDuration: 7200, // 2 hours
      },
      inlinePolicies: [
        {
          name: 'AnalyticsAccess',
          policy: {
            version: '2012-10-17',
            statements: [
              {
                effect: 'Allow',
                actions: [
                  's3:GetObject',
                  's3:ListBucket',
                  'athena:StartQueryExecution',
                  'athena:GetQueryResults',
                ],
                resources: [
                  'arn:aws:s3:::data-lake-bucket/analytics/*',
                  'arn:aws:athena:*:*:workgroup/analytics',
                ],
                conditions: {
                  DateGreaterThan: { 'aws:CurrentTime': '09:00Z' },
                  DateLessThan: { 'aws:CurrentTime': '17:00Z' },
                  Bool: { 'aws:MultiFactorAuthPresent': 'true' },
                },
              },
            ],
          },
        },
      ],
    },
  ],
});
```

### 3. Emergency Access Role

```typescript
const emergencyAccess = new IamComponent('emergency-access', {
  name: 'emergency-access',
  roles: [
    {
      name: 'emergency-break-glass-role',
      trustPolicy: {
        accounts: ['123456789012'],
        requireMfa: true,
        externalId: 'emergency-break-glass-2024',
        maxSessionDuration: 3600, // 1 hour
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
                actions: ['iam:AttachRolePolicy', 'iam:CreateRole', 'iam:PutRolePolicy'],
                resources: ['arn:aws:iam::*:role/Emergency-*'],
                conditions: {
                  Bool: { 'aws:MultiFactorAuthPresent': 'true' },
                },
              },
              {
                sid: 'DenyDangerousActions',
                effect: 'Deny',
                actions: ['iam:DeleteUser', 'organizations:*', 'account:*'],
                resources: ['*'],
              },
            ],
          },
        },
      ],
    },
  ],
});
```

## Constants and Utilities

### Service Principals

```typescript
import { SERVICE_PRINCIPALS } from 'modular-pulumi-aws-framework';

// Available service principals
SERVICE_PRINCIPALS.EC2; // 'ec2.amazonaws.com'
SERVICE_PRINCIPALS.LAMBDA; // 'lambda.amazonaws.com'
SERVICE_PRINCIPALS.ECS_TASKS; // 'ecs-tasks.amazonaws.com'
SERVICE_PRINCIPALS.API_GATEWAY; // 'apigateway.amazonaws.com'
// ... and many more
```

### Managed Policy ARNs

```typescript
import { MANAGED_POLICIES } from 'modular-pulumi-aws-framework';

// Common managed policies
MANAGED_POLICIES.LAMBDA_BASIC_EXECUTION;
MANAGED_POLICIES.ECS_TASK_EXECUTION;
MANAGED_POLICIES.SSM_MANAGED_INSTANCE;
MANAGED_POLICIES.S3_READ_ONLY;
// ... and many more
```

### Validation Functions

```typescript
import { validateRoleName, validatePolicyName } from 'modular-pulumi-aws-framework';

// Validate role names
const roleValidation = validateRoleName('my-role-name');
if (!roleValidation.isValid) {
  console.error('Invalid role name:', roleValidation.errors);
}

// Validate policy names
const policyValidation = validatePolicyName('my-policy-name');
if (!policyValidation.isValid) {
  console.error('Invalid policy name:', policyValidation.errors);
}
```

## Error Handling

The module includes comprehensive error handling and validation:

```typescript
// Role name validation
try {
  const iam = new IamComponent('my-iam', {
    name: 'my-iam',
    roles: [
      {
        name: 'invalid-role-name-that-is-too-long-and-exceeds-aws-limits',
        trustPolicy: { services: ['ec2.amazonaws.com'] },
      },
    ],
  });
} catch (error) {
  console.error('Invalid role name:', error.message);
}

// Permission grant validation
try {
  iam.grantS3Access('non-existent-role', 'arn:aws:s3:::my-bucket');
} catch (error) {
  console.error('Role not found:', error.message);
}
```

## Monitoring and Compliance

### CloudTrail Integration

All IAM operations are automatically logged to CloudTrail. Monitor role assumptions and policy changes:

```json
{
  "eventName": "AssumeRole",
  "sourceIPAddress": "203.0.113.1",
  "userIdentity": {
    "type": "AssumedRole",
    "principalId": "AIDACKCEVSQ6C2EXAMPLE:session-name",
    "arn": "arn:aws:sts::123456789012:assumed-role/my-role/session-name"
  }
}
```

### Access Analyzer

Use AWS IAM Access Analyzer to:

- Identify unused permissions
- Detect overly permissive policies
- Find external access to resources
- Generate least-privilege policies

### Security Recommendations

1. **Regular Auditing**: Review role usage and permissions quarterly
2. **Permission Boundaries**: Use permission boundaries for additional security
3. **External ID Rotation**: Rotate external IDs for cross-account access annually
4. **Session Duration**: Use the shortest session duration that meets operational needs
5. **MFA Enforcement**: Require MFA for human access to sensitive roles
6. **Monitoring**: Set up CloudWatch alarms for unusual role assumption patterns

## Migration from Other IAM Solutions

### From AWS CDK

```typescript
// AWS CDK
const role = new iam.Role(this, 'MyRole', {
  assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
  managedPolicies: [
    iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
  ],
});

// Modular Pulumi AWS Framework
const iamComponent = new IamComponent('my-iam', {
  name: 'my-iam',
  serviceRoles: {
    lambda: {}, // Includes basic execution role by default
  },
});
```

### From Terraform

```hcl
# Terraform
resource "aws_iam_role" "lambda_role" {
  name = "lambda-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}
```

```typescript
// Modular Pulumi AWS Framework
const iam = new IamComponent('lambda-iam', {
  name: 'lambda-iam',
  roles: [
    {
      name: 'lambda-role',
      trustPolicy: { services: ['lambda.amazonaws.com'] },
    },
  ],
});
```

## Troubleshooting

### Common Issues

1. **Role Name Validation Errors**
   - Ensure role names are 1-64 characters
   - Use only alphanumeric characters and `+=,.@-_`

2. **Trust Policy Issues**
   - Verify service principals are correct
   - Check external ID format for cross-account access
   - Ensure MFA device is configured when required

3. **Permission Boundary Conflicts**
   - Verify permissions boundary allows required actions
   - Check that boundary doesn't conflict with role policies

4. **Cross-Account Access Problems**
   - Confirm external ID matches exactly
   - Verify trusted account IDs are correct
   - Check that destination account has proper assume role permissions

### Debug Information

Enable debug logging to troubleshoot issues:

```typescript
// Enable detailed logging
const iam = new IamComponent(
  'debug-iam',
  {
    name: 'debug-iam',
    // ... configuration
  },
  {
    // Enable Pulumi resource logging
    logResource: true,
  }
);
```

## Examples

See the `examples/iam/` directory for complete working examples:

- [`basic-roles.ts`](../../examples/iam/basic-roles.ts) - Basic service roles
- [`service-roles.ts`](../../examples/iam/service-roles.ts) - Pre-configured service roles
- [`cross-account-access.ts`](../../examples/iam/cross-account-access.ts) - Cross-account access patterns
- [`custom-policies.ts`](../../examples/iam/custom-policies.ts) - Advanced custom policies

## API Reference

### IamComponent

Main component class for IAM management.

#### Constructor

```typescript
constructor(name: string, args: IamArgs, opts?: ComponentResourceOptions)
```

#### Properties

- `roles: { [key: string]: aws.iam.Role }` - Created IAM roles
- `policies: { [key: string]: aws.iam.Policy }` - Created IAM policies
- `users: { [key: string]: aws.iam.User }` - Created IAM users
- `groups: { [key: string]: aws.iam.Group }` - Created IAM groups
- `instanceProfiles: { [key: string]: aws.iam.InstanceProfile }` - Created instance profiles
- `roleArns: { [key: string]: Output<string> }` - Role ARNs for easy reference
- `policyArns: { [key: string]: Output<string> }` - Policy ARNs for easy reference

#### Methods

- `grantS3Access(roleName: string, bucketArn: string, access?: 'read' | 'write' | 'full'): void`
- `grantCloudWatchLogsAccess(roleName: string, logGroupArn?: string): void`
- `grantSecretsManagerAccess(roleName: string, secretArn: string): void`
- `grantParameterStoreAccess(roleName: string, parameterPath: string): void`
- `getOutputs(): IamOutputs`

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines on contributing to this module.

## Security

For security-related issues, please see [SECURITY.md](../../SECURITY.md).

## License

This module is part of the Modular Pulumi AWS Framework and is licensed under the MIT License.
