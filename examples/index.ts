/**
 * Examples for the Modular Pulumi AWS Framework
 *
 * This directory contains working examples demonstrating how to use
 * the various modules in real-world scenarios.
 */

// VPC Examples
export * from './vpc/basic-vpc';
export * from './vpc/advanced-vpc';
export * from './vpc/multi-region-vpc';
export * from './vpc/cost-optimized-vpc';

// S3 Examples
export * from './s3/basic-bucket';
export * from './s3/advanced-bucket';
export * from './s3/website-bucket';
export * from './s3/backup-bucket';

// IAM Examples
export * as basicRoles from './iam/basic-roles';
export * as serviceRoles from './iam/service-roles';
export * as crossAccountAccess from './iam/cross-account-access';
export * as customPolicies from './iam/custom-policies';
