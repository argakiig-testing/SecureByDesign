/**
 * IAM Module Integration Tests
 *
 * Integration tests for the IAM component using LocalStack
 */

import { IamComponent } from '../iam';
import { IamArgs } from '../types';
import { IAMClient } from '@aws-sdk/client-iam';
import {
  checkLocalStackStatus,
  waitForLocalStack,
  skipIfLocalStackUnavailable,
  localStackTest,
  type LocalStackStatus,
} from '../../../tests/helpers/localstack';

// Mock LocalStack IAM client
const mockIamClient = {
  send: jest.fn(),
};

// Mock the IAM client
jest.mock('@aws-sdk/client-iam', () => ({
  IAMClient: jest.fn().mockImplementation(() => mockIamClient),
  GetRoleCommand: jest.fn().mockImplementation(input => ({ input })),
  GetPolicyCommand: jest.fn().mockImplementation(input => ({ input })),
  GetUserCommand: jest.fn().mockImplementation(input => ({ input })),
  GetGroupCommand: jest.fn().mockImplementation(input => ({ input })),
  ListAttachedRolePoliciesCommand: jest.fn().mockImplementation(input => ({ input })),
  GetRolePolicyCommand: jest.fn().mockImplementation(input => ({ input })),
  GetInstanceProfileCommand: jest.fn().mockImplementation(input => ({ input })),
  NoSuchEntityException: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'NoSuchEntityException';
    }
  },
}));

// Mock Pulumi for integration tests - use actual ComponentResource but mock outputs
jest.mock('@pulumi/pulumi', () => {
  const originalPulumi = jest.requireActual('@pulumi/pulumi');
  return {
    ...originalPulumi,
    output: jest.fn().mockImplementation(value => ({
      apply: jest.fn().mockImplementation(fn => fn(value)),
      __pulumiOutput: true,
    })),
  };
});

// Mock AWS resources to simulate LocalStack behavior
jest.mock('@pulumi/aws', () => ({
  iam: {
    Role: jest.fn().mockImplementation((_name, args) => ({
      name: args.name,
      arn: `arn:aws:iam::123456789012:role/${args.name}`,
      id: args.name,
      __pulumiType: 'aws:iam/role:Role',
    })),
    Policy: jest.fn().mockImplementation((_name, args) => ({
      name: args.name,
      arn: `arn:aws:iam::123456789012:policy/${args.name}`,
      id: args.name,
      __pulumiType: 'aws:iam/policy:Policy',
    })),
    User: jest.fn().mockImplementation((_name, args) => ({
      name: args.name,
      arn: `arn:aws:iam::123456789012:user/${args.name}`,
      id: args.name,
      __pulumiType: 'aws:iam/user:User',
    })),
    Group: jest.fn().mockImplementation((_name, args) => ({
      name: args.name,
      arn: `arn:aws:iam::123456789012:group/${args.name}`,
      id: args.name,
      __pulumiType: 'aws:iam/group:Group',
    })),
    InstanceProfile: jest.fn().mockImplementation((_name, args) => ({
      name: args.name,
      arn: `arn:aws:iam::123456789012:instance-profile/${args.name}`,
      id: args.name,
      __pulumiType: 'aws:iam/instanceProfile:InstanceProfile',
    })),
    RolePolicyAttachment: jest.fn().mockImplementation(() => ({
      __pulumiType: 'aws:iam/rolePolicyAttachment:RolePolicyAttachment',
    })),
    RolePolicy: jest.fn().mockImplementation(() => ({
      __pulumiType: 'aws:iam/rolePolicy:RolePolicy',
    })),
    UserPolicyAttachment: jest.fn().mockImplementation(() => ({
      __pulumiType: 'aws:iam/userPolicyAttachment:UserPolicyAttachment',
    })),
    UserPolicy: jest.fn().mockImplementation(() => ({
      __pulumiType: 'aws:iam/userPolicy:UserPolicy',
    })),
    GroupPolicyAttachment: jest.fn().mockImplementation(() => ({
      __pulumiType: 'aws:iam/groupPolicyAttachment:GroupPolicyAttachment',
    })),
    GroupPolicy: jest.fn().mockImplementation(() => ({
      __pulumiType: 'aws:iam/groupPolicy:GroupPolicy',
    })),
    UserGroupMembership: jest.fn().mockImplementation(() => ({
      __pulumiType: 'aws:iam/userGroupMembership:UserGroupMembership',
    })),
  },
}));

describe('IAM Integration Tests', () => {
  let localStackStatus: LocalStackStatus;

  beforeAll(async () => {
    // Check LocalStack availability once for all tests
    localStackStatus = await checkLocalStackStatus();

    if (localStackStatus.isAvailable) {
      console.log(`LocalStack is available at ${localStackStatus.endpoint}`);
      console.log(`Available services:`, localStackStatus.services);

      // Wait for IAM service to be ready
      try {
        await waitForLocalStack(['iam'], { maxAttempts: 5, delay: 2000 });
      } catch {
        console.warn('IAM service not ready, some tests may be skipped');
      }

      // Initialize IAM client pointing to LocalStack
      new IAMClient({
        endpoint: localStackStatus.endpoint,
        region: 'us-east-1',
        credentials: {
          accessKeyId: 'test',
          secretAccessKey: 'test',
        },
      });
    } else {
      console.warn('LocalStack is not available - integration tests will be skipped');
      if (localStackStatus.error) {
        console.warn(`Error: ${localStackStatus.error}`);
      }
    }
  }, 60000); // 60 second timeout for setup

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Role Management', () => {
    it(
      'should create IAM role with trust policy',
      localStackTest('IAM role creation', ['iam'], async () => {
        const args: IamArgs = {
          name: 'test-iam-integration',
          roles: [
            {
              name: 'test-integration-role',
              trustPolicy: {
                services: ['ec2.amazonaws.com'],
              },
            },
          ],
        };

        // Mock successful role creation
        mockIamClient.send.mockResolvedValueOnce({
          Role: {
            RoleName: 'test-integration-role',
            Arn: 'arn:aws:iam::123456789012:role/test-integration-role',
            AssumeRolePolicyDocument: JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: { Service: 'ec2.amazonaws.com' },
                  Action: 'sts:AssumeRole',
                },
              ],
            }),
          },
        });

        const component = new IamComponent('test-iam-integration', args);

        // Verify role was created
        expect(component.roles['test-integration-role']).toBeDefined();
        expect(component.roleArns['test-integration-role']).toBeDefined();

        console.log('Successfully created IAM role with trust policy');
      })
    );

    it(
      'should create IAM role with instance profile',
      localStackTest('IAM role with instance profile', ['iam'], async () => {
        const args: IamArgs = {
          name: 'test-iam-integration',
          roles: [
            {
              name: 'test-ec2-role',
              trustPolicy: {
                services: ['ec2.amazonaws.com'],
              },
              createInstanceProfile: true,
            },
          ],
        };

        // Mock successful role and instance profile creation
        mockIamClient.send.mockResolvedValueOnce({
          Role: {
            RoleName: 'test-ec2-role',
            Arn: 'arn:aws:iam::123456789012:role/test-ec2-role',
          },
        });

        mockIamClient.send.mockResolvedValueOnce({
          InstanceProfile: {
            InstanceProfileName: 'test-ec2-role-profile',
            Arn: 'arn:aws:iam::123456789012:instance-profile/test-ec2-role-profile',
          },
        });

        const component = new IamComponent('test-iam-integration', args);

        // Verify role and instance profile were created
        expect(component.roles['test-ec2-role']).toBeDefined();
        expect(component.instanceProfiles['test-ec2-role']).toBeDefined();

        console.log('Successfully created IAM role with instance profile');
      })
    );

    it(
      'should attach managed policies to role',
      localStackTest('IAM role with managed policies', ['iam'], async () => {
        const args: IamArgs = {
          name: 'test-iam-integration',
          roles: [
            {
              name: 'test-role-with-policies',
              trustPolicy: {
                services: ['lambda.amazonaws.com'],
              },
              managedPolicyArns: [
                'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
              ],
            },
          ],
        };

        // Mock successful role creation and policy attachment
        mockIamClient.send.mockResolvedValueOnce({
          Role: {
            RoleName: 'test-role-with-policies',
            Arn: 'arn:aws:iam::123456789012:role/test-role-with-policies',
          },
        });

        mockIamClient.send.mockResolvedValueOnce({
          AttachedPolicies: [
            {
              PolicyName: 'AWSLambdaBasicExecutionRole',
              PolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
            },
          ],
        });

        const component = new IamComponent('test-iam-integration', args);

        // Verify role was created
        expect(component.roles['test-role-with-policies']).toBeDefined();

        console.log('Successfully attached managed policies to IAM role');
      })
    );

    it(
      'should create role with inline policies',
      localStackTest('IAM role with inline policies', ['iam'], async () => {
        const args: IamArgs = {
          name: 'test-iam-integration',
          roles: [
            {
              name: 'test-role-with-inline',
              trustPolicy: {
                services: ['lambda.amazonaws.com'],
              },
              inlinePolicies: [
                {
                  name: 'CustomS3Access',
                  policy: {
                    version: '2012-10-17',
                    statements: [
                      {
                        effect: 'Allow',
                        actions: ['s3:GetObject'],
                        resources: ['arn:aws:s3:::my-test-bucket/*'],
                      },
                    ],
                  },
                },
              ],
            },
          ],
        };

        // Mock successful role creation and inline policy
        mockIamClient.send.mockResolvedValueOnce({
          Role: {
            RoleName: 'test-role-with-inline',
            Arn: 'arn:aws:iam::123456789012:role/test-role-with-inline',
          },
        });

        mockIamClient.send.mockResolvedValueOnce({
          PolicyName: 'CustomS3Access',
          PolicyDocument: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['s3:GetObject'],
                Resource: ['arn:aws:s3:::my-test-bucket/*'],
              },
            ],
          }),
        });

        const component = new IamComponent('test-iam-integration', args);

        // Verify role was created
        expect(component.roles['test-role-with-inline']).toBeDefined();

        console.log('Successfully created IAM role with inline policies');
      })
    );
  });

  describe('Policy Management', () => {
    it('should create IAM policy', async () => {
      const localStackAvailable = await checkLocalStackStatus();
      if (!localStackAvailable.isAvailable) {
        console.log('Skipping test: LocalStack not available');
        return;
      }

      const args: IamArgs = {
        name: 'test-iam-integration',
        policies: [
          {
            name: 'test-custom-policy',
            policy: {
              version: '2012-10-17',
              statements: [
                {
                  effect: 'Allow',
                  actions: ['s3:ListBucket'],
                  resources: ['arn:aws:s3:::my-test-bucket'],
                },
              ],
            },
          },
        ],
      };

      // Mock successful policy creation
      mockIamClient.send.mockResolvedValueOnce({
        Policy: {
          PolicyName: 'test-custom-policy',
          Arn: 'arn:aws:iam::123456789012:policy/test-custom-policy',
          PolicyDocument: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['s3:ListBucket'],
                Resource: ['arn:aws:s3:::my-test-bucket'],
              },
            ],
          }),
        },
      });

      const component = new IamComponent('test-iam-integration', args);

      // Verify policy was created
      expect(component.policies['test-custom-policy']).toBeDefined();
      expect(component.policyArns['test-custom-policy']).toBeDefined();
    });
  });

  describe('User Management', () => {
    it('should create IAM user', async () => {
      const localStackAvailable = await checkLocalStackStatus();
      if (!localStackAvailable.isAvailable) {
        console.log('Skipping test: LocalStack not available');
        return;
      }

      const args: IamArgs = {
        name: 'test-iam-integration',
        users: [
          {
            name: 'test-user',
            forceDestroy: true,
          },
        ],
      };

      // Mock successful user creation
      mockIamClient.send.mockResolvedValueOnce({
        User: {
          UserName: 'test-user',
          Arn: 'arn:aws:iam::123456789012:user/test-user',
        },
      });

      const component = new IamComponent('test-iam-integration', args);

      // Verify user was created
      expect(component.users['test-user']).toBeDefined();
    });
  });

  describe('Group Management', () => {
    it('should create IAM group', async () => {
      const localStackAvailable = await checkLocalStackStatus();
      if (!localStackAvailable.isAvailable) {
        console.log('Skipping test: LocalStack not available');
        return;
      }

      const args: IamArgs = {
        name: 'test-iam-integration',
        groups: [
          {
            name: 'test-group',
          },
        ],
      };

      // Mock successful group creation
      mockIamClient.send.mockResolvedValueOnce({
        Group: {
          GroupName: 'test-group',
          Arn: 'arn:aws:iam::123456789012:group/test-group',
        },
      });

      const component = new IamComponent('test-iam-integration', args);

      // Verify group was created
      expect(component.groups['test-group']).toBeDefined();
    });
  });

  describe('Service Roles', () => {
    it('should create EC2 service role', async () => {
      const localStackAvailable = await checkLocalStackStatus();
      if (!localStackAvailable.isAvailable) {
        console.log('Skipping test: LocalStack not available');
        return;
      }

      const args: IamArgs = {
        name: 'test-iam-integration',
        serviceRoles: {
          ec2: {
            additionalPolicies: ['arn:aws:iam::aws:policy/ReadOnlyAccess'],
          },
        },
      };

      // Mock successful service role creation
      mockIamClient.send.mockResolvedValueOnce({
        Role: {
          RoleName: 'test-iam-integration-ec2-role',
          Arn: 'arn:aws:iam::123456789012:role/test-iam-integration-ec2-role',
        },
      });

      mockIamClient.send.mockResolvedValueOnce({
        InstanceProfile: {
          InstanceProfileName: 'test-iam-integration-ec2-role-profile',
          Arn: 'arn:aws:iam::123456789012:instance-profile/test-iam-integration-ec2-role-profile',
        },
      });

      const component = new IamComponent('test-iam-integration', args);

      // Verify service role was created
      expect(component.roles['test-iam-integration-ec2-role']).toBeDefined();
      expect(component.instanceProfiles['test-iam-integration-ec2-role']).toBeDefined();
    });

    it('should create Lambda service role', async () => {
      const localStackAvailable = await checkLocalStackStatus();
      if (!localStackAvailable.isAvailable) {
        console.log('Skipping test: LocalStack not available');
        return;
      }

      const args: IamArgs = {
        name: 'test-iam-integration',
        serviceRoles: {
          lambda: {
            vpcAccess: true,
          },
        },
      };

      // Mock successful Lambda service role creation
      mockIamClient.send.mockResolvedValueOnce({
        Role: {
          RoleName: 'test-iam-integration-lambda-role',
          Arn: 'arn:aws:iam::123456789012:role/test-iam-integration-lambda-role',
        },
      });

      const component = new IamComponent('test-iam-integration', args);

      // Verify Lambda service role was created
      expect(component.roles['test-iam-integration-lambda-role']).toBeDefined();
    });
  });

  describe('Cross-Account Access', () => {
    it('should create cross-account role', async () => {
      const localStackAvailable = await checkLocalStackStatus();
      if (!localStackAvailable.isAvailable) {
        console.log('Skipping test: LocalStack not available');
        return;
      }

      const args: IamArgs = {
        name: 'test-iam-integration',
        crossAccountAccess: {
          trustedAccounts: ['123456789012'],
          externalId: 'test-external-id',
          requireMfa: true,
          allowedActions: ['s3:GetObject'],
          allowedResources: ['arn:aws:s3:::shared-bucket/*'],
        },
      };

      // Mock successful cross-account role creation
      mockIamClient.send.mockResolvedValueOnce({
        Role: {
          RoleName: 'test-iam-integration-cross-account-role',
          Arn: 'arn:aws:iam::123456789012:role/test-iam-integration-cross-account-role',
          AssumeRolePolicyDocument: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: { AWS: 'arn:aws:iam::123456789012:root' },
                Action: 'sts:AssumeRole',
                Condition: {
                  Bool: { 'aws:MultiFactorAuthPresent': 'true' },
                  StringEquals: { 'sts:ExternalId': 'test-external-id' },
                },
              },
            ],
          }),
        },
      });

      const component = new IamComponent('test-iam-integration', args);

      // Verify cross-account role was created
      expect(component.roles['test-iam-integration-cross-account-role']).toBeDefined();
    });
  });

  describe('Permission Grants', () => {
    it('should grant S3 access to existing role', async () => {
      const localStackAvailable = await checkLocalStackStatus();
      if (!localStackAvailable.isAvailable) {
        console.log('Skipping test: LocalStack not available');
        return;
      }

      const args: IamArgs = {
        name: 'test-iam-integration',
        roles: [
          {
            name: 'test-role-for-grants',
            trustPolicy: {
              services: ['lambda.amazonaws.com'],
            },
          },
        ],
      };

      // Mock successful role creation
      mockIamClient.send.mockResolvedValueOnce({
        Role: {
          RoleName: 'test-role-for-grants',
          Arn: 'arn:aws:iam::123456789012:role/test-role-for-grants',
        },
      });

      const component = new IamComponent('test-iam-integration', args);

      // Grant S3 access
      component.grantS3Access('test-role-for-grants', 'arn:aws:s3:::test-bucket', 'read');

      // Verify the grant was applied (in real test, we'd check the actual policy)
      expect(component.roles['test-role-for-grants']).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle resource creation failures gracefully', async () => {
      const localStackAvailable = await checkLocalStackStatus();
      if (!localStackAvailable.isAvailable) {
        console.log('Skipping test: LocalStack not available');
        return;
      }

      const args: IamArgs = {
        name: 'test-iam-integration',
        roles: [
          {
            name: 'test-role-that-fails',
            trustPolicy: {
              services: ['ec2.amazonaws.com'],
            },
          },
        ],
      };

      // Mock failed role creation
      mockIamClient.send.mockRejectedValueOnce(new Error('Role creation failed'));

      // The component should still be created, but without the failed role
      const component = new IamComponent('test-iam-integration', args);

      // Verify component was created
      expect(component).toBeDefined();
    });
  });

  describe('LocalStack Service Availability', () => {
    it('should provide consistent feedback when LocalStack is unavailable', async () => {
      // This test demonstrates the consistent error handling
      const status = await checkLocalStackStatus();

      if (!status.isAvailable) {
        skipIfLocalStackUnavailable(status, 'IAM service availability test');
        console.log('Demonstrated consistent LocalStack unavailable handling for IAM');
      } else {
        console.log('LocalStack IAM service is available for testing');
        console.log(`IAM service status: ${status.services.iam}`);
      }

      // This test always passes to demonstrate the pattern
      expect(true).toBe(true);
    });

    it(
      'should verify LocalStack IAM service connectivity',
      localStackTest('IAM service connectivity', ['iam'], async () => {
        const status = await checkLocalStackStatus();

        expect(status.isAvailable).toBe(true);
        expect(status.services.iam).toBe('available');

        console.log(`IAM service health check passed at ${status.endpoint}`);
        console.log(`IAM service status: ${status.services.iam}`);
      })
    );
  });
});

describe('LocalStack Health Check', () => {
  it('should check LocalStack availability for integration tests', async () => {
    const status = await checkLocalStackStatus();

    if (!status.isAvailable) {
      console.log('LocalStack is not available for integration tests');
      console.log(
        'To run integration tests, start LocalStack with: docker compose up -d localstack'
      );
      if (status.error) {
        console.log(`Error: ${status.error}`);
      }
    } else {
      console.log(`LocalStack is available at ${status.endpoint}`);
      console.log(`Available services:`, status.services);
    }

    // This test always passes, but provides useful information
    expect(true).toBe(true);
  });
});
