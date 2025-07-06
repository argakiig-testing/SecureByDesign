/**
 * IAM Module Unit Tests
 *
 * Tests for the IAM component with mocked dependencies
 */

import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { IamComponent } from '../iam';
import { IamArgs } from '../types';
import {
  validateRoleName,
  validatePolicyName,
  createTrustPolicy,
  policyDocumentToJson,
  generateSecureResourceName,
  SERVICE_ROLE_TRUST_POLICIES,
  COMMON_POLICIES,
  IAM_DEFAULTS,
} from '../defaults';

// Mock Pulumi resources
jest.mock('@pulumi/aws');
jest.mock('@pulumi/pulumi');

// Mock AWS IAM resources with proper Pulumi outputs
const createMockOutput = (value: string) => ({
  apply: jest.fn().mockImplementation(fn => fn(value)),
  __pulumiOutput: true,
});

const mockRole = {
  name: createMockOutput('test-role'),
  arn: createMockOutput('arn:aws:iam::123456789012:role/test-role'),
  id: createMockOutput('test-role'),
};

const mockPolicy = {
  name: createMockOutput('test-policy'),
  arn: createMockOutput('arn:aws:iam::123456789012:policy/test-policy'),
  id: createMockOutput('test-policy'),
};

const mockUser = {
  name: createMockOutput('test-user'),
  arn: createMockOutput('arn:aws:iam::123456789012:user/test-user'),
  id: createMockOutput('test-user'),
};

const mockGroup = {
  name: createMockOutput('test-group'),
  arn: createMockOutput('arn:aws:iam::123456789012:group/test-group'),
  id: createMockOutput('test-group'),
};

const mockInstanceProfile = {
  name: createMockOutput('test-instance-profile'),
  arn: createMockOutput('arn:aws:iam::123456789012:instance-profile/test-instance-profile'),
  id: createMockOutput('test-instance-profile'),
};

// Mock ComponentResource
class MockComponentResource {
  constructor(
    public readonly __pulumiType: string,
    public readonly __name: string
  ) {}
  registerOutputs() {}
}

beforeEach(() => {
  // Reset mocks
  jest.clearAllMocks();

  // Mock Pulumi ComponentResource
  (pulumi.ComponentResource as any) = jest.fn().mockImplementation((type, name) => {
    return new MockComponentResource(type, name);
  });

  // Mock Pulumi Output
  (pulumi.output as any) = jest.fn().mockImplementation(value => createMockOutput(value));

  // Mock AWS IAM resources
  (aws.iam.Role as any) = jest.fn().mockImplementation(() => mockRole);
  (aws.iam.Policy as any) = jest.fn().mockImplementation(() => mockPolicy);
  (aws.iam.User as any) = jest.fn().mockImplementation(() => mockUser);
  (aws.iam.Group as any) = jest.fn().mockImplementation(() => mockGroup);
  (aws.iam.InstanceProfile as any) = jest.fn().mockImplementation(() => mockInstanceProfile);
  (aws.iam.RolePolicyAttachment as any) = jest.fn().mockImplementation(() => ({}));
  (aws.iam.RolePolicy as any) = jest.fn().mockImplementation(() => ({}));
  (aws.iam.UserPolicyAttachment as any) = jest.fn().mockImplementation(() => ({}));
  (aws.iam.UserPolicy as any) = jest.fn().mockImplementation(() => ({}));
  (aws.iam.GroupPolicyAttachment as any) = jest.fn().mockImplementation(() => ({}));
  (aws.iam.GroupPolicy as any) = jest.fn().mockImplementation(() => ({}));
  (aws.iam.UserGroupMembership as any) = jest.fn().mockImplementation(() => ({}));
});

describe('IAM Component', () => {
  describe('Component Creation', () => {
    it('should create an IAM component with default settings', () => {
      const args: IamArgs = {
        name: 'test-iam',
      };

      const component = new IamComponent('test-iam', args);

      expect(component).toBeDefined();
      expect(component.roles).toBeDefined();
      expect(component.policies).toBeDefined();
      expect(component.users).toBeDefined();
      expect(component.groups).toBeDefined();
      expect(component.instanceProfiles).toBeDefined();
      expect(component.roleArns).toBeDefined();
      expect(component.policyArns).toBeDefined();
    });

    it('should create roles when provided', () => {
      const args: IamArgs = {
        name: 'test-iam',
        roles: [
          {
            name: 'test-role',
            trustPolicy: {
              services: ['ec2.amazonaws.com'],
            },
          },
        ],
      };

      const component = new IamComponent('test-iam', args);

      expect(component).toBeDefined();
      expect(aws.iam.Role).toHaveBeenCalledWith(
        'test-iam-role-test-role',
        expect.objectContaining({
          name: 'test-role',
          path: '/',
          description: 'Role created by test-iam',
          maxSessionDuration: 14400,
          forceDetachPolicies: true,
        }),
        expect.objectContaining({ parent: expect.anything() })
      );

      // Verify the assume role policy is a valid JSON string
      const roleCall = (aws.iam.Role as unknown as jest.Mock).mock.calls[0];
      const roleArgs = roleCall[1];
      expect(roleArgs.assumeRolePolicy).toBeDefined();
      expect(() => JSON.parse(roleArgs.assumeRolePolicy)).not.toThrow();
      expect(roleArgs.tags).toEqual({
        Component: 'IAM',
        ManagedBy: 'SecureByDesign',
        SecurityLevel: 'high',
        Compliance: 'required',
      });
    });

    it('should create policies when provided', () => {
      const args: IamArgs = {
        name: 'test-iam',
        policies: [
          {
            name: 'test-policy',
            policy: {
              version: '2012-10-17',
              statements: [
                {
                  effect: 'Allow',
                  actions: 's3:GetObject',
                  resources: 'arn:aws:s3:::my-bucket/*',
                },
              ],
            },
          },
        ],
      };

      const component = new IamComponent('test-iam', args);

      expect(component).toBeDefined();
      expect(aws.iam.Policy).toHaveBeenCalledWith(
        'test-iam-policy-test-policy',
        expect.objectContaining({
          name: 'test-policy',
          path: '/',
          description: 'Policy created by test-iam',
        }),
        expect.objectContaining({ parent: expect.anything() })
      );

      // Verify the policy is a valid JSON string
      const policyCall = (aws.iam.Policy as unknown as jest.Mock).mock.calls[0];
      const policyArgs = policyCall[1];
      expect(policyArgs.policy).toBeDefined();
      expect(() => JSON.parse(policyArgs.policy)).not.toThrow();
      expect(policyArgs.tags).toEqual({
        Component: 'IAM',
        ManagedBy: 'SecureByDesign',
        SecurityLevel: 'high',
        Compliance: 'required',
      });
    });

    it('should create users when provided', () => {
      const args: IamArgs = {
        name: 'test-iam',
        users: [
          {
            name: 'test-user',
            forceDestroy: true,
          },
        ],
      };

      const component = new IamComponent('test-iam', args);

      expect(component).toBeDefined();
      expect(aws.iam.User).toHaveBeenCalledWith(
        'test-iam-user-test-user',
        expect.objectContaining({
          name: 'test-user',
          path: '/',
          forceDestroy: true,
        }),
        expect.objectContaining({ parent: expect.anything() })
      );

      // Verify the tags
      const userCall = (aws.iam.User as unknown as jest.Mock).mock.calls[0];
      const userArgs = userCall[1];
      expect(userArgs.tags).toEqual({
        Component: 'IAM',
        ManagedBy: 'SecureByDesign',
        SecurityLevel: 'high',
        Compliance: 'required',
      });
    });

    it('should create groups when provided', () => {
      const args: IamArgs = {
        name: 'test-iam',
        groups: [
          {
            name: 'test-group',
          },
        ],
      };

      const component = new IamComponent('test-iam', args);

      expect(component).toBeDefined();
      expect(aws.iam.Group).toHaveBeenCalledWith(
        'test-iam-group-test-group',
        expect.objectContaining({
          name: 'test-group',
          path: '/',
        }),
        expect.objectContaining({ parent: expect.anything() })
      );
    });

    it('should create instance profile when requested', () => {
      const args: IamArgs = {
        name: 'test-iam',
        roles: [
          {
            name: 'test-role',
            trustPolicy: {
              services: ['ec2.amazonaws.com'],
            },
            createInstanceProfile: true,
          },
        ],
      };

      const component = new IamComponent('test-iam', args);

      expect(component).toBeDefined();
      expect(aws.iam.InstanceProfile).toHaveBeenCalledWith(
        'test-iam-profile-test-role',
        expect.objectContaining({
          name: 'test-role-profile',
          path: '/',
        }),
        expect.objectContaining({ parent: expect.anything() })
      );

      // Verify the role and tags
      const profileCall = (aws.iam.InstanceProfile as unknown as jest.Mock).mock.calls[0];
      const profileArgs = profileCall[1];
      expect(profileArgs.role).toBeDefined();
      expect(profileArgs.tags).toEqual({
        Component: 'IAM',
        ManagedBy: 'SecureByDesign',
        SecurityLevel: 'high',
        Compliance: 'required',
      });
    });
  });

  describe('Service Roles', () => {
    it('should create EC2 service role', () => {
      const args: IamArgs = {
        name: 'test-iam',
        serviceRoles: {
          ec2: {
            additionalPolicies: ['arn:aws:iam::aws:policy/CustomPolicy'],
          },
        },
      };

      const component = new IamComponent('test-iam', args);

      expect(component).toBeDefined();
      expect(aws.iam.Role).toHaveBeenCalledWith(
        'test-iam-role-test-iam-ec2-role',
        expect.objectContaining({
          name: 'test-iam-ec2-role',
          path: '/',
          description: 'Role created by test-iam',
          maxSessionDuration: 3600,
          forceDetachPolicies: true,
        }),
        expect.objectContaining({ parent: expect.anything() })
      );
    });

    it('should create Lambda service role', () => {
      const args: IamArgs = {
        name: 'test-iam',
        serviceRoles: {
          lambda: {
            vpcAccess: true,
          },
        },
      };

      const component = new IamComponent('test-iam', args);

      expect(component).toBeDefined();
      expect(aws.iam.Role).toHaveBeenCalledWith(
        'test-iam-role-test-iam-lambda-role',
        expect.objectContaining({
          name: 'test-iam-lambda-role',
          path: '/',
          description: 'Role created by test-iam',
          maxSessionDuration: 3600,
          forceDetachPolicies: true,
        }),
        expect.objectContaining({ parent: expect.anything() })
      );
    });

    it('should create ECS service roles', () => {
      const args: IamArgs = {
        name: 'test-iam',
        serviceRoles: {
          ecsTask: {},
          ecsExecution: {
            logGroups: ['arn:aws:logs:us-east-1:123456789012:log-group:/aws/ecs/my-app'],
          },
        },
      };

      const component = new IamComponent('test-iam', args);

      expect(component).toBeDefined();
      expect(aws.iam.Role).toHaveBeenCalledWith(
        'test-iam-role-test-iam-ecs-task-role',
        expect.objectContaining({
          name: 'test-iam-ecs-task-role',
          path: '/',
          description: 'Role created by test-iam',
          maxSessionDuration: 3600,
          forceDetachPolicies: true,
        }),
        expect.objectContaining({ parent: expect.anything() })
      );

      expect(aws.iam.Role).toHaveBeenCalledWith(
        'test-iam-role-test-iam-ecs-execution-role',
        expect.objectContaining({
          name: 'test-iam-ecs-execution-role',
          path: '/',
          description: 'Role created by test-iam',
          maxSessionDuration: 3600,
          forceDetachPolicies: true,
        }),
        expect.objectContaining({ parent: expect.anything() })
      );
    });
  });

  describe('Cross-Account Access', () => {
    it('should create cross-account role', () => {
      const args: IamArgs = {
        name: 'test-iam',
        crossAccountAccess: {
          trustedAccounts: ['123456789012'],
          externalId: 'unique-external-id',
          requireMfa: true,
          allowedActions: ['s3:GetObject'],
          allowedResources: ['arn:aws:s3:::my-bucket/*'],
        },
      };

      const component = new IamComponent('test-iam', args);

      expect(component).toBeDefined();
      expect(aws.iam.Role).toHaveBeenCalledWith(
        'test-iam-role-test-iam-cross-account-role',
        expect.objectContaining({
          name: 'test-iam-cross-account-role',
          path: '/',
          description: 'Role created by test-iam',
          maxSessionDuration: 3600,
          forceDetachPolicies: true,
        }),
        expect.objectContaining({ parent: expect.anything() })
      );
    });
  });

  describe('Permission Grants', () => {
    it('should grant S3 access to role', () => {
      const args: IamArgs = {
        name: 'test-iam',
        roles: [
          {
            name: 'test-role',
            trustPolicy: {
              services: ['lambda.amazonaws.com'],
            },
          },
        ],
      };

      const component = new IamComponent('test-iam', args);

      component.grantS3Access('test-role', 'arn:aws:s3:::my-bucket', 'read');

      expect(aws.iam.RolePolicy).toHaveBeenCalledWith(
        'test-iam-test-role-s3-read',
        expect.objectContaining({
          name: 'S3ReadAccess',
        }),
        expect.objectContaining({ parent: expect.anything() })
      );

      // Verify the policy and role
      const policyCall = (aws.iam.RolePolicy as unknown as jest.Mock).mock.calls[0];
      const policyArgs = policyCall[1];
      expect(policyArgs.policy).toBeDefined();
      expect(() => JSON.parse(policyArgs.policy)).not.toThrow();
      expect(policyArgs.role).toBeDefined();
    });

    it('should grant CloudWatch logs access to role', () => {
      const args: IamArgs = {
        name: 'test-iam',
        roles: [
          {
            name: 'test-role',
            trustPolicy: {
              services: ['lambda.amazonaws.com'],
            },
          },
        ],
      };

      const component = new IamComponent('test-iam', args);

      component.grantCloudWatchLogsAccess('test-role');

      expect(aws.iam.RolePolicy).toHaveBeenCalledWith(
        'test-iam-test-role-cloudwatch-logs',
        expect.objectContaining({
          name: 'CloudWatchLogsAccess',
        }),
        expect.objectContaining({ parent: expect.anything() })
      );
    });

    it('should grant Secrets Manager access to role', () => {
      const args: IamArgs = {
        name: 'test-iam',
        roles: [
          {
            name: 'test-role',
            trustPolicy: {
              services: ['lambda.amazonaws.com'],
            },
          },
        ],
      };

      const component = new IamComponent('test-iam', args);

      component.grantSecretsManagerAccess(
        'test-role',
        'arn:aws:secretsmanager:us-east-1:123456789012:secret:my-secret'
      );

      expect(aws.iam.RolePolicy).toHaveBeenCalledWith(
        'test-iam-test-role-secrets-manager',
        expect.objectContaining({
          name: 'SecretsManagerAccess',
        }),
        expect.objectContaining({ parent: expect.anything() })
      );
    });

    it('should grant Parameter Store access to role', () => {
      const args: IamArgs = {
        name: 'test-iam',
        roles: [
          {
            name: 'test-role',
            trustPolicy: {
              services: ['lambda.amazonaws.com'],
            },
          },
        ],
      };

      const component = new IamComponent('test-iam', args);

      component.grantParameterStoreAccess('test-role', '/app/config');

      expect(aws.iam.RolePolicy).toHaveBeenCalledWith(
        'test-iam-test-role-parameter-store',
        expect.objectContaining({
          name: 'ParameterStoreAccess',
        }),
        expect.objectContaining({ parent: expect.anything() })
      );
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid role name', () => {
      const args: IamArgs = {
        name: 'test-iam',
        roles: [
          {
            name: 'invalid-role-name-that-is-way-too-long-and-exceeds-the-maximum-allowed-length-for-aws-iam-roles',
            trustPolicy: {
              services: ['ec2.amazonaws.com'],
            },
          },
        ],
      };

      expect(() => new IamComponent('test-iam', args)).toThrow('Invalid role name');
    });

    it('should throw error for invalid policy name', () => {
      const args: IamArgs = {
        name: 'test-iam',
        policies: [
          {
            name: 'invalid-policy-name-that-is-way-too-long-and-exceeds-the-maximum-allowed-length-for-aws-iam-policies-which-should-be-no-more-than-128-characters',
            policy: {
              version: '2012-10-17',
              statements: [
                {
                  effect: 'Allow',
                  actions: 's3:GetObject',
                  resources: 'arn:aws:s3:::my-bucket/*',
                },
              ],
            },
          },
        ],
      };

      expect(() => new IamComponent('test-iam', args)).toThrow('Invalid policy name');
    });

    it('should throw error when granting access to non-existent role', () => {
      const args: IamArgs = {
        name: 'test-iam',
      };

      const component = new IamComponent('test-iam', args);

      expect(() => component.grantS3Access('non-existent-role', 'arn:aws:s3:::my-bucket')).toThrow(
        'Role non-existent-role not found'
      );
    });
  });
});

describe('IAM Defaults and Utilities', () => {
  describe('Role Name Validation', () => {
    it('should validate correct role names', () => {
      const result = validateRoleName('ValidRoleName');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject names that are too long', () => {
      const result = validateRoleName('a'.repeat(65));
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Role name must be between 1 and 64 characters');
    });

    it('should reject names with invalid characters', () => {
      const result = validateRoleName('Invalid#Role*Name');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Role name can only contain alphanumeric characters and +=,.@-_'
      );
    });

    it('should reject empty names', () => {
      const result = validateRoleName('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Role name must be between 1 and 64 characters');
    });
  });

  describe('Policy Name Validation', () => {
    it('should validate correct policy names', () => {
      const result = validatePolicyName('ValidPolicyName');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject names that are too long', () => {
      const result = validatePolicyName('a'.repeat(129));
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Policy name must be between 1 and 128 characters');
    });

    it('should reject names with invalid characters', () => {
      const result = validatePolicyName('Invalid#Policy*Name');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Policy name can only contain alphanumeric characters and +=,.@-_'
      );
    });
  });

  describe('Trust Policy Creation', () => {
    it('should create trust policy for service principals', () => {
      const trustPolicy = createTrustPolicy({
        services: ['ec2.amazonaws.com', 'lambda.amazonaws.com'],
      });

      expect(trustPolicy.version).toBe('2012-10-17');
      expect(trustPolicy.statements).toHaveLength(1);
      expect(trustPolicy.statements[0]?.effect).toBe('Allow');
      expect(trustPolicy.statements[0]?.actions).toBe('sts:AssumeRole');
      expect(trustPolicy.statements[0]?.principals).toEqual([
        {
          type: 'Service',
          identifiers: ['ec2.amazonaws.com', 'lambda.amazonaws.com'],
        },
      ]);
    });

    it('should create trust policy for AWS accounts', () => {
      const trustPolicy = createTrustPolicy({
        accounts: ['123456789012', '123456789013'],
      });

      expect(trustPolicy.statements).toHaveLength(1);
      expect(trustPolicy.statements[0]?.principals).toEqual([
        {
          type: 'AWS',
          identifiers: ['arn:aws:iam::123456789012:root', 'arn:aws:iam::123456789013:root'],
        },
      ]);
    });

    it('should create trust policy with MFA requirement', () => {
      const trustPolicy = createTrustPolicy({
        services: ['ec2.amazonaws.com'],
        requireMfa: true,
      });

      expect(trustPolicy.statements[0]?.conditions).toEqual({
        Bool: {
          'aws:MultiFactorAuthPresent': 'true',
        },
      });
    });

    it('should create trust policy with external ID', () => {
      const trustPolicy = createTrustPolicy({
        accounts: ['123456789012'],
        externalId: 'unique-external-id',
      });

      expect(trustPolicy.statements[0]?.conditions).toEqual({
        StringEquals: {
          'sts:ExternalId': 'unique-external-id',
        },
      });
    });
  });

  describe('Policy Document to JSON', () => {
    it('should convert policy document to JSON', () => {
      const policyDoc = {
        version: '2012-10-17' as const,
        statements: [
          {
            effect: 'Allow' as const,
            actions: ['s3:GetObject'],
            resources: ['arn:aws:s3:::my-bucket/*'],
          },
        ],
      };

      const json = policyDocumentToJson(policyDoc);
      const parsed = JSON.parse(json);

      expect(parsed.Version).toBe('2012-10-17');
      expect(parsed.Statement).toHaveLength(1);
      expect(parsed.Statement[0]?.Effect).toBe('Allow');
      expect(parsed.Statement[0]?.Action).toEqual(['s3:GetObject']);
      expect(parsed.Statement[0]?.Resource).toEqual(['arn:aws:s3:::my-bucket/*']);
    });
  });

  describe('Secure Resource Name Generation', () => {
    it('should generate secure resource names', () => {
      const name = generateSecureResourceName('test-resource', 'role');
      expect(name).toMatch(/^role-test-resource-[a-z0-9]+$/);
      expect(name.length).toBeLessThanOrEqual(64);
    });

    it('should sanitize invalid characters', () => {
      const name = generateSecureResourceName('test@resource#name', 'policy');
      expect(name).toMatch(/^policy-test-resource-name-[a-z0-9]+$/);
    });

    it('should truncate long names', () => {
      const longName = 'a'.repeat(100);
      const name = generateSecureResourceName(longName, 'role');
      expect(name.length).toBeLessThanOrEqual(64);
    });
  });

  describe('Service Role Trust Policies', () => {
    it('should create EC2 service role trust policy', () => {
      const trustPolicy = SERVICE_ROLE_TRUST_POLICIES.ec2();
      expect(trustPolicy.services).toEqual(['ec2.amazonaws.com']);
      expect(trustPolicy.maxSessionDuration).toBe(3600);
    });

    it('should create Lambda service role trust policy', () => {
      const trustPolicy = SERVICE_ROLE_TRUST_POLICIES.lambda();
      expect(trustPolicy.services).toEqual(['lambda.amazonaws.com']);
      expect(trustPolicy.maxSessionDuration).toBe(3600);
    });

    it('should create cross-account trust policy', () => {
      const trustPolicy = SERVICE_ROLE_TRUST_POLICIES.crossAccount(
        ['123456789012'],
        'external-id',
        true
      );
      expect(trustPolicy.accounts).toEqual(['123456789012']);
      expect(trustPolicy.externalId).toBe('external-id');
      expect(trustPolicy.requireMfa).toBe(true);
    });
  });

  describe('Common Policies', () => {
    it('should create S3 read-only policy', () => {
      const policy = COMMON_POLICIES.s3ReadOnly('arn:aws:s3:::my-bucket');
      expect(policy.statements).toHaveLength(1);
      expect(policy.statements[0]?.actions).toEqual([
        's3:GetObject',
        's3:GetObjectVersion',
        's3:ListBucket',
      ]);
      expect(policy.statements[0]?.resources).toEqual([
        'arn:aws:s3:::my-bucket',
        'arn:aws:s3:::my-bucket/*',
      ]);
    });

    it('should create CloudWatch logs write policy', () => {
      const policy = COMMON_POLICIES.cloudWatchLogsWrite();
      expect(policy.statements).toHaveLength(1);
      expect(policy.statements[0]?.actions).toEqual([
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        'logs:DescribeLogStreams',
      ]);
    });

    it('should create Secrets Manager read policy', () => {
      const policy = COMMON_POLICIES.secretsManagerRead(
        'arn:aws:secretsmanager:us-east-1:123456789012:secret:my-secret'
      );
      expect(policy.statements).toHaveLength(1);
      expect(policy.statements[0]?.actions).toEqual([
        'secretsmanager:GetSecretValue',
        'secretsmanager:DescribeSecret',
      ]);
    });
  });

  describe('IAM Defaults', () => {
    it('should have secure default values', () => {
      expect(IAM_DEFAULTS.path).toBe('/');
      expect(IAM_DEFAULTS.maxSessionDuration).toBe(14400);
      expect(IAM_DEFAULTS.forceDetachPolicies).toBe(true);
      expect(IAM_DEFAULTS.tags).toEqual({
        ManagedBy: 'SecureByDesign',
        Component: 'IAM',
        SecurityLevel: 'high',
        Compliance: 'required',
      });
    });

    it('should have secure conditions', () => {
      expect(IAM_DEFAULTS.secureConditions.requireSsl).toEqual({
        Bool: {
          'aws:SecureTransport': 'true',
        },
      });

      expect(IAM_DEFAULTS.secureConditions.requireMfa).toEqual({
        Bool: {
          'aws:MultiFactorAuthPresent': 'true',
        },
      });
    });
  });
});
