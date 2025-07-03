/**
 * Basic VPC Example
 *
 * This example demonstrates how to create a secure VPC with the default configuration.
 * Perfect for development environments and getting started.
 */

import { VpcComponent } from '../modules/vpc';

// Create a basic VPC with secure defaults
const network = new VpcComponent('example', {
  name: 'example',
  tags: {
    Environment: 'development',
    Project: 'modinfra-example',
    Owner: 'platform-team',
  },
});

// Export key outputs for use by other stacks
export const vpcId = network.vpcId;
export const publicSubnetIds = network.publicSubnetIds;
export const privateSubnetIds = network.privateSubnetIds;

// Example of accessing individual subnets
export const firstPublicSubnet = network.publicSubnets[0]?.id;
export const firstPrivateSubnet = network.privateSubnets[0]?.id;

// Network information for debugging
export const vpcCidr = network.vpc.cidrBlock;
export const internetGatewayId = network.internetGateway.id;
