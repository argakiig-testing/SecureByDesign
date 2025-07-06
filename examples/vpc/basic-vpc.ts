/**
 * Basic VPC Example
 *
 * This example demonstrates creating a basic, secure VPC with public and private subnets.
 * The VPC includes:
 * - Public and private subnets across 2 availability zones
 * - Internet Gateway for public access
 * - NAT Gateway for secure outbound access from private subnets
 * - Proper routing configuration
 */

import { VpcComponent } from 'modular-pulumi-aws-framework';

// Create a basic VPC with secure defaults
const network = new VpcComponent('example', {
  name: 'example-vpc',
  cidrBlock: '10.0.0.0/16',
  enableNatGateway: true,
  availabilityZoneCount: 2,
  tags: {
    Environment: 'development',
    Project: 'example',
    ManagedBy: 'pulumi',
  },
});

// Export VPC information for use in other stacks
export const vpcId = network.vpcId;
export const publicSubnetIds = network.publicSubnetIds;
export const privateSubnetIds = network.privateSubnetIds;
export const internetGatewayId = network.internetGateway.id;
