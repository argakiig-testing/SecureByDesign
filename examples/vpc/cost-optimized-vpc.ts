/**
 * Cost-Optimized VPC Example
 *
 * This example demonstrates creating a VPC optimized for cost in development/testing:
 * - Single NAT Gateway for cost savings
 * - Fewer availability zones
 * - Smaller subnet allocations
 * - Development-appropriate configurations
 */

import { VpcComponent } from 'modular-pulumi-aws-framework';

// Create a cost-optimized VPC for development environments
const devNetwork = new VpcComponent('dev', {
  name: 'dev-vpc',
  cidrBlock: '10.10.0.0/16',
  enableNatGateway: true,
  multiAzNatGateway: false, // Single NAT Gateway to reduce costs
  availabilityZoneCount: 2, // Minimum for redundancy but cost-effective
  enableDnsHostnames: true,
  enableDnsSupport: true,
  tags: {
    Environment: 'development',
    Project: 'cost-optimized',
    CostOptimization: 'enabled',
    AutoShutdown: 'after-hours', // Could be used by automation
    Owner: 'dev-team',
  },
});

// Create a minimal VPC for testing (even more cost-optimized)
const testNetwork = new VpcComponent('test', {
  name: 'test-vpc',
  cidrBlock: '10.20.0.0/16',
  enableNatGateway: false, // No NAT Gateway for maximum cost savings
  availabilityZoneCount: 1, // Single AZ for testing
  enableDnsHostnames: true,
  enableDnsSupport: true,
  tags: {
    Environment: 'testing',
    Project: 'minimal-cost',
    Purpose: 'ephemeral-testing',
    AutoDestroy: 'nightly', // Could be used by automation
  },
});

// Export development VPC information
export const devVpcId = devNetwork.vpcId;
export const devPublicSubnetIds = devNetwork.publicSubnetIds;
export const devPrivateSubnetIds = devNetwork.privateSubnetIds;

// Export test VPC information
export const testVpcId = testNetwork.vpcId;
export const testPublicSubnetIds = testNetwork.publicSubnetIds;
export const testPrivateSubnetIds = testNetwork.privateSubnetIds;

// Note: Test VPC has no NAT Gateway, so private subnets cannot reach the internet
// This is suitable for testing isolated workloads or when using VPC endpoints
