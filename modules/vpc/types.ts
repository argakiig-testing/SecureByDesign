/**
 * Type definitions for the VPC module
 */

import { Input } from '@pulumi/pulumi';

/**
 * Configuration options for the VPC component
 */
export interface VpcArgs {
  /**
   * The CIDR block for the VPC
   * @default "10.0.0.0/16"
   */
  readonly cidrBlock?: Input<string>;

  /**
   * Whether to enable DNS hostnames in the VPC
   * @default true
   */
  readonly enableDnsHostnames?: Input<boolean>;

  /**
   * Whether to enable DNS support in the VPC
   * @default true
   */
  readonly enableDnsSupport?: Input<boolean>;

  /**
   * Whether to create a NAT gateway for private subnet internet access
   * @default true
   */
  readonly enableNatGateway?: Input<boolean>;

  /**
   * Whether to create multiple NAT gateways (one per AZ) for high availability
   * @default false
   */
  readonly multiAzNatGateway?: Input<boolean>;

  /**
   * Number of availability zones to use
   * @default 2
   */
  readonly availabilityZoneCount?: Input<number>;

  /**
   * Custom tags to apply to all resources
   */
  readonly tags?: Input<Record<string, Input<string>>>;

  /**
   * Name prefix for all resources
   */
  readonly name: string;
}

/**
 * Subnet configuration for the VPC
 */
export interface SubnetConfig {
  readonly cidrBlock: string;
  readonly availabilityZone: string;
  readonly isPublic: boolean;
}

/**
 * Output properties of the VPC component
 */
export interface VpcOutputs {
  /**
   * The VPC resource
   */
  readonly vpc: import('@pulumi/aws').ec2.Vpc;

  /**
   * Public subnets
   */
  readonly publicSubnets: readonly import('@pulumi/aws').ec2.Subnet[];

  /**
   * Private subnets
   */
  readonly privateSubnets: readonly import('@pulumi/aws').ec2.Subnet[];

  /**
   * Internet Gateway
   */
  readonly internetGateway: import('@pulumi/aws').ec2.InternetGateway;

  /**
   * NAT Gateways (if enabled)
   */
  readonly natGateways: readonly import('@pulumi/aws').ec2.NatGateway[] | undefined;

  /**
   * Route tables
   */
  readonly routeTables: {
    readonly public: import('@pulumi/aws').ec2.RouteTable;
    readonly private: readonly import('@pulumi/aws').ec2.RouteTable[];
  };

  /**
   * VPC ID for use in other modules
   */
  readonly vpcId: import('@pulumi/pulumi').Output<string>;

  /**
   * Public subnet IDs
   */
  readonly publicSubnetIds: readonly import('@pulumi/pulumi').Output<string>[];

  /**
   * Private subnet IDs
   */
  readonly privateSubnetIds: readonly import('@pulumi/pulumi').Output<string>[];
}
