/**
 * Secure default values for VPC configuration
 */

import { VpcArgs } from './types';

/**
 * Default VPC configuration with security best practices
 */
export const VPC_DEFAULTS: Required<Omit<VpcArgs, 'name' | 'tags'>> = {
  // Use RFC 1918 private address space
  cidrBlock: '10.0.0.0/16',

  // Enable DNS features for proper service discovery
  enableDnsHostnames: true,
  enableDnsSupport: true,

  // Enable NAT gateway for secure outbound internet access from private subnets
  enableNatGateway: true,

  // Single NAT gateway by default for cost optimization
  // Set to true for production high availability
  multiAzNatGateway: false,

  // Use 2 AZs for high availability
  availabilityZoneCount: 2,
};

/**
 * Default tags applied to all VPC resources for auditing and cost tracking
 */
export const DEFAULT_TAGS = {
  'ModInfra:Module': 'vpc',
  'ModInfra:ManagedBy': 'modular-pulumi-aws-framework',
  'ModInfra:SecurityLevel': 'secure-by-default',
} as const;

/**
 * Calculate subnet CIDR blocks based on VPC CIDR
 * Splits the VPC into equal subnets across AZs
 *
 * @param vpcCidr - The VPC CIDR block (e.g., "10.0.0.0/16")
 * @param azCount - Number of availability zones
 * @returns Array of subnet configurations
 */
export function calculateSubnetCidrs(
  vpcCidr: string,
  azCount: number
): {
  publicSubnets: string[];
  privateSubnets: string[];
} {
  // For a /16 VPC, create /24 subnets
  // First half for public, second half for private
  const baseOctets = vpcCidr.split('.').slice(0, 2);
  const publicSubnets: string[] = [];
  const privateSubnets: string[] = [];

  // Public subnets start from .0.0/24
  for (let i = 0; i < azCount; i++) {
    publicSubnets.push(`${baseOctets[0]}.${baseOctets[1]}.${i}.0/24`);
  }

  // Private subnets start from .10.0/24 (leaving gap for expansion)
  for (let i = 0; i < azCount; i++) {
    privateSubnets.push(`${baseOctets[0]}.${baseOctets[1]}.${10 + i}.0/24`);
  }

  return { publicSubnets, privateSubnets };
}

/**
 * Security groups default rules for VPC
 */
export const SECURITY_GROUP_DEFAULTS = {
  // Block all inbound traffic by default
  defaultIngressRules: [],

  // Allow all outbound traffic (can be restricted per application)
  defaultEgressRules: [
    {
      protocol: '-1',
      fromPort: 0,
      toPort: 0,
      cidrBlocks: ['0.0.0.0/0'],
    },
  ],
} as const;
