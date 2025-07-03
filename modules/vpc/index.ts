/**
 * VPC Module - Secure networking infrastructure
 *
 * Provides a secure, production-ready VPC with:
 * - Public/private subnets across multiple AZs
 * - NAT Gateway for secure outbound access
 * - Internet Gateway for public resources
 * - Proper routing and security defaults
 *
 * @example
 * ```typescript
 * import { VpcComponent } from '@modinfra/vpc';
 *
 * const network = new VpcComponent('main', {
 *   name: 'main',
 *   cidrBlock: '10.0.0.0/16',
 *   enableNatGateway: true,
 * });
 *
 * // Use in other modules
 * const appService = new EcsService('app', {
 *   vpc: network.vpc,
 *   subnets: network.privateSubnetIds,
 * });
 * ```
 */

// Export the main VPC component
export { VpcComponent } from './vpc';

// Export types for consumers
export type { VpcArgs, VpcOutputs, SubnetConfig } from './types';

// Export defaults for advanced users
export { VPC_DEFAULTS, DEFAULT_TAGS, calculateSubnetCidrs } from './defaults';

// Convenience re-export for common use case
export { VpcComponent as Vpc } from './vpc';
