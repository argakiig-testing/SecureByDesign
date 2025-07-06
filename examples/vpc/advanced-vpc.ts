/**
 * Advanced VPC Example
 *
 * This example demonstrates creating a VPC with advanced configuration:
 * - Multiple availability zones for high availability
 * - Multi-AZ NAT Gateways for redundancy
 * - Custom CIDR blocks
 * - Comprehensive tagging strategy
 */

import { VpcComponent } from 'modular-pulumi-aws-framework';

// Create an advanced VPC with high availability configuration
const advancedNetwork = new VpcComponent('advanced', {
  name: 'advanced-vpc',
  cidrBlock: '172.16.0.0/16',
  enableNatGateway: true,
  multiAzNatGateway: true, // Enable NAT Gateway in each AZ for high availability
  availabilityZoneCount: 3, // Use 3 AZs for better availability
  enableDnsHostnames: true,
  enableDnsSupport: true,
  tags: {
    Environment: 'production',
    Project: 'platform',
    Team: 'infrastructure',
    CostCenter: '12345',
    Compliance: 'SOC2',
    BackupPolicy: 'daily',
  },
});

// Export VPC information
export const advancedVpcId = advancedNetwork.vpcId;
export const advancedPublicSubnetIds = advancedNetwork.publicSubnetIds;
export const advancedPrivateSubnetIds = advancedNetwork.privateSubnetIds;
export const advancedInternetGatewayId = advancedNetwork.internetGateway.id;
export const advancedNatGatewayIds = advancedNetwork.natGateways?.map(nat => nat.id);

// Export route table information for advanced routing scenarios
export const advancedPublicRouteTableId = advancedNetwork.routeTables.public.id;
export const advancedPrivateRouteTableIds = advancedNetwork.routeTables.private.map(rt => rt.id);
