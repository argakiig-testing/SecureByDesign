/**
 * Multi-Region VPC Example
 *
 * This example demonstrates creating VPCs across multiple regions with:
 * - Consistent CIDR block allocation to avoid conflicts
 * - Standardized naming conventions
 * - Preparation for cross-region connectivity (VPC peering, Transit Gateway)
 * - Region-specific configurations
 */

import { VpcComponent } from 'modular-pulumi-aws-framework';

// Primary region VPC (us-east-1)
const primaryVpc = new VpcComponent('primary', {
  name: 'primary-vpc',
  cidrBlock: '10.0.0.0/16', // Primary region CIDR
  enableNatGateway: true,
  multiAzNatGateway: true,
  availabilityZoneCount: 3,
  tags: {
    Environment: 'production',
    Project: 'global-platform',
    Region: 'primary',
    Role: 'main-workloads',
  },
});

// Secondary region VPC (us-west-2) - would need to be deployed with different AWS provider
const secondaryVpcConfig = {
  name: 'secondary-vpc',
  cidrBlock: '10.1.0.0/16', // Non-overlapping CIDR for secondary region
  enableNatGateway: true,
  multiAzNatGateway: false, // Cost optimization for secondary region
  availabilityZoneCount: 2, // Fewer AZs for cost optimization
  tags: {
    Environment: 'production',
    Project: 'global-platform',
    Region: 'secondary',
    Role: 'dr-workloads',
  },
};

// Note: To actually deploy to multiple regions, you would need to:
// 1. Configure multiple AWS providers with different regions
// 2. Create separate VPC components with each provider
// 3. Set up VPC peering or Transit Gateway for connectivity

// Export primary VPC information
export const primaryVpcId = primaryVpc.vpcId;
export const primaryPublicSubnetIds = primaryVpc.publicSubnetIds;
export const primaryPrivateSubnetIds = primaryVpc.privateSubnetIds;

// Export secondary VPC configuration for reference
export const secondaryVpcConfigExport = secondaryVpcConfig;
