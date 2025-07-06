/**
 * IAM Component
 *
 * Security-first IAM management with comprehensive role and policy support
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import {
  IamArgs,
  IamOutputs,
  IamRoleConfig,
  IamPolicyConfig,
  IamUserConfig,
  IamGroupConfig,
  PolicyDocument,
  ServiceRoleConfig,
  CrossAccountConfig,
} from './types';
import {
  IAM_DEFAULTS,
  createTrustPolicy,
  policyDocumentToJson,
  SERVICE_ROLE_CONFIGS,
  SERVICE_ROLE_TRUST_POLICIES,
  COMMON_POLICIES,
  validateRoleName,
  validatePolicyName,
} from './defaults';

/**
 * IAM Component - Comprehensive Identity and Access Management
 */
export class IamComponent extends pulumi.ComponentResource {
  /** Created IAM roles */
  public readonly roles: { [key: string]: aws.iam.Role } = {};

  /** Created IAM policies */
  public readonly policies: { [key: string]: aws.iam.Policy } = {};

  /** Created IAM users */
  public readonly users: { [key: string]: aws.iam.User } = {};

  /** Created IAM groups */
  public readonly groups: { [key: string]: aws.iam.Group } = {};

  /** Created instance profiles */
  public readonly instanceProfiles: { [key: string]: aws.iam.InstanceProfile } = {};

  /** Role ARNs for easy reference */
  public readonly roleArns: { [key: string]: pulumi.Output<string> } = {};

  /** Policy ARNs for easy reference */
  public readonly policyArns: { [key: string]: pulumi.Output<string> } = {};

  /** Component name for resource naming */
  private readonly componentName: string;

  /** Default tags for all resources */
  private readonly defaultTags: Record<string, pulumi.Input<string>>;

  constructor(name: string, args: IamArgs, opts?: pulumi.ComponentResourceOptions) {
    super('securebydesign:iam:IamComponent', name, {}, opts);

    this.componentName = name;
    this.defaultTags = {
      ...IAM_DEFAULTS.tags,
      ...args.tags,
    };

    // Create IAM policies first (they may be referenced by roles)
    if (args.policies) {
      this.createPolicies(args.policies);
    }

    // Create IAM roles
    if (args.roles) {
      this.createRoles(args.roles);
    }

    // Create IAM users
    if (args.users) {
      this.createUsers(args.users);
    }

    // Create IAM groups
    if (args.groups) {
      this.createGroups(args.groups);
    }

    // Create service roles
    if (args.serviceRoles) {
      this.createServiceRoles(args.serviceRoles);
    }

    // Create cross-account access roles
    if (args.crossAccountAccess) {
      this.createCrossAccountRole(args.crossAccountAccess);
    }

    // Register outputs
    this.registerOutputs({
      roles: this.roles,
      policies: this.policies,
      users: this.users,
      groups: this.groups,
      instanceProfiles: this.instanceProfiles,
      roleArns: this.roleArns,
      policyArns: this.policyArns,
    });
  }

  /**
   * Create IAM policies
   */
  private createPolicies(policies: IamPolicyConfig[]): void {
    policies.forEach(config => {
      const validation = validatePolicyName(config.name as string);
      if (!validation.isValid) {
        throw new Error(`Invalid policy name: ${validation.errors.join(', ')}`);
      }

      const policyDocument =
        typeof config.policy === 'string'
          ? config.policy
          : policyDocumentToJson(config.policy as PolicyDocument);

      const policy = new aws.iam.Policy(
        `${this.componentName}-policy-${config.name}`,
        {
          name: config.name,
          ...(config.namePrefix && { namePrefix: config.namePrefix }),
          path: config.path || IAM_DEFAULTS.path,
          description: config.description || `Policy created by ${this.componentName}`,
          policy: policyDocument,
          tags: {
            ...this.defaultTags,
            ...config.tags,
          },
        },
        { parent: this }
      );

      this.policies[config.name as string] = policy;
      this.policyArns[config.name as string] = policy.arn;
    });
  }

  /**
   * Create IAM roles
   */
  private createRoles(roles: IamRoleConfig[]): void {
    roles.forEach(config => {
      const validation = validateRoleName(config.name as string);
      if (!validation.isValid) {
        throw new Error(`Invalid role name: ${validation.errors.join(', ')}`);
      }

      // Create trust policy
      const trustPolicyDocument = createTrustPolicy(config.trustPolicy);
      const trustPolicyJson = policyDocumentToJson(trustPolicyDocument);

      // Create the role
      const role = new aws.iam.Role(
        `${this.componentName}-role-${config.name}`,
        {
          name: config.name,
          path: config.path || IAM_DEFAULTS.path,
          description: config.description || `Role created by ${this.componentName}`,
          assumeRolePolicy: trustPolicyJson,
          maxSessionDuration:
            config.trustPolicy.maxSessionDuration || IAM_DEFAULTS.maxSessionDuration,
          forceDetachPolicies: config.forceDetachPolicies ?? IAM_DEFAULTS.forceDetachPolicies,
          ...(config.permissionsBoundary && { permissionsBoundary: config.permissionsBoundary }),
          tags: {
            ...this.defaultTags,
            ...config.tags,
          },
        },
        { parent: this }
      );

      this.roles[config.name as string] = role;
      this.roleArns[config.name as string] = role.arn;

      // Attach managed policies
      if (config.managedPolicyArns) {
        config.managedPolicyArns.forEach((policyArn, index) => {
          new aws.iam.RolePolicyAttachment(
            `${this.componentName}-role-${config.name}-managed-${index}`,
            {
              role: role.name,
              policyArn: policyArn,
            },
            { parent: this }
          );
        });
      }

      // Attach inline policies
      if (config.inlinePolicies) {
        config.inlinePolicies.forEach(inlinePolicy => {
          const policyDocument =
            typeof inlinePolicy.policy === 'string'
              ? inlinePolicy.policy
              : policyDocumentToJson(inlinePolicy.policy as PolicyDocument);

          new aws.iam.RolePolicy(
            `${this.componentName}-role-${config.name}-inline-${inlinePolicy.name}`,
            {
              role: role.id,
              name: inlinePolicy.name,
              policy: policyDocument,
            },
            { parent: this }
          );
        });
      }

      // Create instance profile if requested
      if (config.createInstanceProfile) {
        const instanceProfile = new aws.iam.InstanceProfile(
          `${this.componentName}-profile-${config.name}`,
          {
            name: `${config.name}-profile`,
            path: config.path || IAM_DEFAULTS.path,
            role: role.name,
            tags: {
              ...this.defaultTags,
              ...config.tags,
            },
          },
          { parent: this }
        );

        this.instanceProfiles[config.name as string] = instanceProfile;
      }
    });
  }

  /**
   * Create IAM users
   */
  private createUsers(users: IamUserConfig[]): void {
    users.forEach(config => {
      const user = new aws.iam.User(
        `${this.componentName}-user-${config.name}`,
        {
          name: config.name,
          path: config.path || IAM_DEFAULTS.path,
          forceDestroy: config.forceDestroy ?? true,
          ...(config.permissionsBoundary && { permissionsBoundary: config.permissionsBoundary }),
          tags: {
            ...this.defaultTags,
            ...config.tags,
          },
        },
        { parent: this }
      );

      this.users[config.name as string] = user;

      // Attach managed policies
      if (config.managedPolicyArns) {
        config.managedPolicyArns.forEach((policyArn, index) => {
          new aws.iam.UserPolicyAttachment(
            `${this.componentName}-user-${config.name}-managed-${index}`,
            {
              user: user.name,
              policyArn: policyArn,
            },
            { parent: this }
          );
        });
      }

      // Attach inline policies
      if (config.inlinePolicies) {
        config.inlinePolicies.forEach(inlinePolicy => {
          const policyDocument =
            typeof inlinePolicy.policy === 'string'
              ? inlinePolicy.policy
              : policyDocumentToJson(inlinePolicy.policy as PolicyDocument);

          new aws.iam.UserPolicy(
            `${this.componentName}-user-${config.name}-inline-${inlinePolicy.name}`,
            {
              user: user.id,
              name: inlinePolicy.name,
              policy: policyDocument,
            },
            { parent: this }
          );
        });
      }

      // Add to groups
      if (config.groups) {
        config.groups.forEach((groupName, index) => {
          new aws.iam.UserGroupMembership(
            `${this.componentName}-user-${config.name}-group-${index}`,
            {
              user: user.name,
              groups: [groupName],
            },
            { parent: this }
          );
        });
      }
    });
  }

  /**
   * Create IAM groups
   */
  private createGroups(groups: IamGroupConfig[]): void {
    groups.forEach(config => {
      const group = new aws.iam.Group(
        `${this.componentName}-group-${config.name}`,
        {
          name: config.name,
          path: config.path || IAM_DEFAULTS.path,
        },
        { parent: this }
      );

      this.groups[config.name as string] = group;

      // Attach managed policies
      if (config.managedPolicyArns) {
        config.managedPolicyArns.forEach((policyArn, index) => {
          new aws.iam.GroupPolicyAttachment(
            `${this.componentName}-group-${config.name}-managed-${index}`,
            {
              group: group.name,
              policyArn: policyArn,
            },
            { parent: this }
          );
        });
      }

      // Attach inline policies
      if (config.inlinePolicies) {
        config.inlinePolicies.forEach(inlinePolicy => {
          const policyDocument =
            typeof inlinePolicy.policy === 'string'
              ? inlinePolicy.policy
              : policyDocumentToJson(inlinePolicy.policy as PolicyDocument);

          new aws.iam.GroupPolicy(
            `${this.componentName}-group-${config.name}-inline-${inlinePolicy.name}`,
            {
              group: group.id,
              name: inlinePolicy.name,
              policy: policyDocument,
            },
            { parent: this }
          );
        });
      }
    });
  }

  /**
   * Create service roles
   */
  private createServiceRoles(serviceRoles: ServiceRoleConfig): void {
    // EC2 service role
    if (serviceRoles.ec2) {
      const config = SERVICE_ROLE_CONFIGS.ec2Instance();
      const roleConfig: IamRoleConfig = {
        name: `${this.componentName}-ec2-role`,
        trustPolicy: config.trustPolicy,
        managedPolicyArns: [
          ...config.managedPolicyArns,
          ...(serviceRoles.ec2.additionalPolicies || []),
        ],
        createInstanceProfile: config.createInstanceProfile,
        ...(serviceRoles.ec2.customPolicies && {
          inlinePolicies: serviceRoles.ec2.customPolicies.map(p => ({
            name: p.name,
            policy: p.policy,
          })),
        }),
      };

      this.createRoles([roleConfig]);
    }

    // Lambda service role
    if (serviceRoles.lambda) {
      const config = serviceRoles.lambda.vpcAccess
        ? SERVICE_ROLE_CONFIGS.lambdaVpc()
        : SERVICE_ROLE_CONFIGS.lambdaBasic();

      const roleConfig: IamRoleConfig = {
        name: `${this.componentName}-lambda-role`,
        trustPolicy: config.trustPolicy,
        managedPolicyArns: [
          ...config.managedPolicyArns,
          ...(serviceRoles.lambda.additionalPolicies || []),
        ],
        ...(serviceRoles.lambda.customPolicies && {
          inlinePolicies: serviceRoles.lambda.customPolicies.map(p => ({
            name: p.name,
            policy: p.policy,
          })),
        }),
      };

      this.createRoles([roleConfig]);
    }

    // ECS task role
    if (serviceRoles.ecsTask) {
      const config = SERVICE_ROLE_CONFIGS.ecsTask();
      const roleConfig: IamRoleConfig = {
        name: `${this.componentName}-ecs-task-role`,
        trustPolicy: config.trustPolicy,
        managedPolicyArns: [
          ...config.managedPolicyArns,
          ...(serviceRoles.ecsTask.additionalPolicies || []),
        ],
        ...(serviceRoles.ecsTask.customPolicies && {
          inlinePolicies: serviceRoles.ecsTask.customPolicies.map(p => ({
            name: p.name,
            policy: p.policy,
          })),
        }),
      };

      this.createRoles([roleConfig]);
    }

    // ECS execution role
    if (serviceRoles.ecsExecution) {
      const config = SERVICE_ROLE_CONFIGS.ecsTaskExecution(serviceRoles.ecsExecution.logGroups);
      const roleConfig: IamRoleConfig = {
        name: `${this.componentName}-ecs-execution-role`,
        trustPolicy: config.trustPolicy,
        managedPolicyArns: [
          ...config.managedPolicyArns,
          ...(serviceRoles.ecsExecution.additionalPolicies || []),
        ],
        ...(config.inlinePolicies && { inlinePolicies: config.inlinePolicies }),
      };

      this.createRoles([roleConfig]);
    }
  }

  /**
   * Create cross-account access role
   */
  private createCrossAccountRole(crossAccountConfig: CrossAccountConfig): void {
    const trustPolicy = SERVICE_ROLE_TRUST_POLICIES.crossAccount(
      crossAccountConfig.trustedAccounts,
      crossAccountConfig.externalId,
      crossAccountConfig.requireMfa
    );

    // Create inline policy for cross-account access
    const inlinePolicies = [];
    if (crossAccountConfig.allowedActions || crossAccountConfig.allowedResources) {
      inlinePolicies.push({
        name: 'CrossAccountAccess',
        policy: {
          version: '2012-10-17' as const,
          statements: [
            {
              effect: 'Allow' as const,
              actions: crossAccountConfig.allowedActions || ['*'],
              resources: crossAccountConfig.allowedResources || ['*'],
            },
          ],
        },
      });
    }

    const roleConfig: IamRoleConfig = {
      name: `${this.componentName}-cross-account-role`,
      trustPolicy: {
        ...trustPolicy,
        maxSessionDuration: crossAccountConfig.sessionDuration || 3600,
      },
      inlinePolicies,
    };

    this.createRoles([roleConfig]);
  }

  /**
   * Grant S3 access to a role
   */
  public grantS3Access(
    roleName: string,
    bucketArn: string,
    access: 'read' | 'write' | 'full' = 'read'
  ): void {
    const role = this.roles[roleName];
    if (!role) {
      throw new Error(`Role ${roleName} not found`);
    }

    let policy: PolicyDocument;
    switch (access) {
      case 'read':
        policy = COMMON_POLICIES.s3ReadOnly(bucketArn);
        break;
      case 'write':
        policy = {
          version: '2012-10-17',
          statements: [
            {
              effect: 'Allow',
              actions: ['s3:PutObject', 's3:PutObjectAcl', 's3:DeleteObject'],
              resources: [`${bucketArn}/*`],
              conditions: IAM_DEFAULTS.secureConditions.requireSsl,
            },
          ],
        };
        break;
      case 'full':
        policy = {
          version: '2012-10-17',
          statements: [
            {
              effect: 'Allow',
              actions: ['s3:*'],
              resources: [bucketArn, `${bucketArn}/*`],
              conditions: IAM_DEFAULTS.secureConditions.requireSsl,
            },
          ],
        };
        break;
    }

    new aws.iam.RolePolicy(
      `${this.componentName}-${roleName}-s3-${access}`,
      {
        role: role.id,
        name: `S3${access.charAt(0).toUpperCase() + access.slice(1)}Access`,
        policy: policyDocumentToJson(policy),
      },
      { parent: this }
    );
  }

  /**
   * Grant CloudWatch logs access to a role
   */
  public grantCloudWatchLogsAccess(roleName: string, logGroupArn?: string): void {
    const role = this.roles[roleName];
    if (!role) {
      throw new Error(`Role ${roleName} not found`);
    }

    const policy = COMMON_POLICIES.cloudWatchLogsWrite(logGroupArn);

    new aws.iam.RolePolicy(
      `${this.componentName}-${roleName}-cloudwatch-logs`,
      {
        role: role.id,
        name: 'CloudWatchLogsAccess',
        policy: policyDocumentToJson(policy),
      },
      { parent: this }
    );
  }

  /**
   * Grant Secrets Manager access to a role
   */
  public grantSecretsManagerAccess(roleName: string, secretArn: string): void {
    const role = this.roles[roleName];
    if (!role) {
      throw new Error(`Role ${roleName} not found`);
    }

    const policy = COMMON_POLICIES.secretsManagerRead(secretArn);

    new aws.iam.RolePolicy(
      `${this.componentName}-${roleName}-secrets-manager`,
      {
        role: role.id,
        name: 'SecretsManagerAccess',
        policy: policyDocumentToJson(policy),
      },
      { parent: this }
    );
  }

  /**
   * Grant Parameter Store access to a role
   */
  public grantParameterStoreAccess(roleName: string, parameterPath: string): void {
    const role = this.roles[roleName];
    if (!role) {
      throw new Error(`Role ${roleName} not found`);
    }

    const policy = COMMON_POLICIES.parameterStoreRead(parameterPath);

    new aws.iam.RolePolicy(
      `${this.componentName}-${roleName}-parameter-store`,
      {
        role: role.id,
        name: 'ParameterStoreAccess',
        policy: policyDocumentToJson(policy),
      },
      { parent: this }
    );
  }

  /**
   * Get outputs for easy access
   */
  public getOutputs(): IamOutputs {
    return {
      roles: this.roles,
      policies: this.policies,
      users: this.users,
      groups: this.groups,
      instanceProfiles: this.instanceProfiles,
      roleArns: this.roleArns,
      policyArns: this.policyArns,
    };
  }
}
