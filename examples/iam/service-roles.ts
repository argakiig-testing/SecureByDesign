/**
 * Service Roles Example
 *
 * Demonstrates using pre-configured service roles for common AWS services
 */

import { IamComponent } from 'modular-pulumi-aws-framework';

// Create service roles using pre-configured templates
const serviceRoles = new IamComponent('service-roles', {
  name: 'service-roles',

  // Use pre-configured service roles for common scenarios
  serviceRoles: {
    // EC2 service role with SSM and CloudWatch access
    ec2: {
      additionalPolicies: [
        'arn:aws:iam::aws:policy/ReadOnlyAccess', // Read-only access for monitoring
        'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess', // S3 read access
      ],
      customPolicies: [
        {
          name: 'CustomAppAccess',
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
                resources: ['arn:aws:dynamodb:*:*:table/MyApp-*'],
              },
            ],
          },
        },
      ],
    },

    // Lambda service role with VPC access
    lambda: {
      vpcAccess: true, // Includes VPC execution permissions
      additionalPolicies: ['arn:aws:iam::aws:policy/AmazonRDSReadOnlyAccess'],
      customPolicies: [
        {
          name: 'LambdaCustomAccess',
          policy: {
            version: '2012-10-17',
            statements: [
              {
                effect: 'Allow',
                actions: ['ses:SendEmail', 'ses:SendRawEmail'],
                resources: ['arn:aws:ses:*:*:identity/*'],
              },
              {
                effect: 'Allow',
                actions: ['sns:Publish'],
                resources: ['arn:aws:sns:*:*:notifications-*'],
              },
            ],
          },
        },
      ],
    },

    // ECS task role for application permissions
    ecsTask: {
      additionalPolicies: ['arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess'],
      customPolicies: [
        {
          name: 'ECSTaskPermissions',
          policy: {
            version: '2012-10-17',
            statements: [
              {
                effect: 'Allow',
                actions: ['secretsmanager:GetSecretValue'],
                resources: ['arn:aws:secretsmanager:*:*:secret:ecs-app/*'],
              },
              {
                effect: 'Allow',
                actions: ['ssm:GetParameter', 'ssm:GetParameters', 'ssm:GetParametersByPath'],
                resources: ['arn:aws:ssm:*:*:parameter/ecs-app/*'],
              },
            ],
          },
        },
      ],
    },

    // ECS execution role for pulling images and logs
    ecsExecution: {
      logGroups: [
        'arn:aws:logs:*:*:log-group:/ecs/my-app',
        'arn:aws:logs:*:*:log-group:/ecs/my-api',
      ],
      additionalPolicies: [
        // Add custom ECR access if needed
        'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly',
      ],
    },
  },

  // Global tags for all service roles
  tags: {
    Project: 'ServiceRolesExample',
    ManagedBy: 'Pulumi',
    Environment: 'production',
    Team: 'Platform',
  },
});

// Export role ARNs for use with other AWS resources
export const ec2RoleArn = serviceRoles.roleArns['service-roles-ec2-role'];
export const lambdaRoleArn = serviceRoles.roleArns['service-roles-lambda-role'];
export const ecsTaskRoleArn = serviceRoles.roleArns['service-roles-ecs-task-role'];
export const ecsExecutionRoleArn = serviceRoles.roleArns['service-roles-ecs-execution-role'];

// Export instance profile for EC2 use
export const ec2InstanceProfile = serviceRoles.instanceProfiles['service-roles-ec2-role'];

// Export the component for further customization
export { serviceRoles };

// Example of using the roles with other AWS services
export const roleUsageExamples = {
  // Use with EC2 instances
  ec2InstanceProfile: ec2InstanceProfile,

  // Use with Lambda functions
  lambdaExecutionRole: lambdaRoleArn,

  // Use with ECS services
  ecsTaskRole: ecsTaskRoleArn,
  ecsExecutionRole: ecsExecutionRoleArn,
};
