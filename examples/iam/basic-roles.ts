/**
 * Basic IAM Roles Example
 *
 * Demonstrates creating basic IAM roles with service trust policies
 */

import { IamComponent } from 'modular-pulumi-aws-framework';

// Create basic IAM roles for common AWS services
const basicIamRoles = new IamComponent('basic-iam-roles', {
  name: 'basic-iam-roles',

  // Create individual roles with specific configurations
  roles: [
    {
      name: 'ec2-basic-role',
      description: 'Basic EC2 service role with SSM access',
      trustPolicy: {
        services: ['ec2.amazonaws.com'],
        maxSessionDuration: 3600, // 1 hour
      },
      managedPolicyArns: [
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
      ],
      createInstanceProfile: true,
      tags: {
        Purpose: 'BasicEC2Access',
        Environment: 'development',
      },
    },
    {
      name: 'lambda-basic-role',
      description: 'Basic Lambda execution role',
      trustPolicy: {
        services: ['lambda.amazonaws.com'],
        maxSessionDuration: 3600,
      },
      managedPolicyArns: ['arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'],
      inlinePolicies: [
        {
          name: 'CustomS3Access',
          policy: {
            version: '2012-10-17',
            statements: [
              {
                effect: 'Allow',
                actions: ['s3:GetObject', 's3:PutObject'],
                resources: ['arn:aws:s3:::my-lambda-bucket/*'],
                conditions: {
                  Bool: {
                    'aws:SecureTransport': 'true',
                  },
                },
              },
            ],
          },
        },
      ],
      tags: {
        Purpose: 'LambdaExecution',
        Environment: 'development',
      },
    },
    {
      name: 'ecs-task-role',
      description: 'ECS task role for application permissions',
      trustPolicy: {
        services: ['ecs-tasks.amazonaws.com'],
        maxSessionDuration: 3600,
      },
      inlinePolicies: [
        {
          name: 'ApplicationPermissions',
          policy: {
            version: '2012-10-17',
            statements: [
              {
                effect: 'Allow',
                actions: ['secretsmanager:GetSecretValue', 'secretsmanager:DescribeSecret'],
                resources: ['arn:aws:secretsmanager:*:*:secret:app/*'],
              },
              {
                effect: 'Allow',
                actions: ['ssm:GetParameter', 'ssm:GetParameters', 'ssm:GetParametersByPath'],
                resources: ['arn:aws:ssm:*:*:parameter/app/*'],
              },
            ],
          },
        },
      ],
      tags: {
        Purpose: 'ECSTaskExecution',
        Environment: 'development',
      },
    },
  ],

  // Global tags for all resources
  tags: {
    Project: 'BasicIAMExample',
    ManagedBy: 'Pulumi',
    Environment: 'development',
  },
});

// Export role ARNs for use in other resources
export const roleArns = basicIamRoles.roleArns;
export const instanceProfiles = basicIamRoles.instanceProfiles;

// Export individual role ARNs for convenience
export const ec2RoleArn = basicIamRoles.roleArns['ec2-basic-role'];
export const lambdaRoleArn = basicIamRoles.roleArns['lambda-basic-role'];
export const ecsTaskRoleArn = basicIamRoles.roleArns['ecs-task-role'];

// Export the component for further customization
export { basicIamRoles };
