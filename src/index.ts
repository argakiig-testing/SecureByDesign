/**
 * Modular Pulumi AWS Framework
 * Secure-by-default AWS infrastructure made simple
 */

// Export implemented modules
export * from '../modules/vpc';

// TODO: Export additional modules as they are implemented
// export * from '../modules/ecs';
// export * from '../modules/s3';
// export * from '../modules/iam';
// export * from '../modules/rds';
// export * from '../modules/cloudfront';
// export * from '../modules/cloudwatch';

// Re-export common Pulumi types for convenience
export { Input, Output } from '@pulumi/pulumi';
export * as aws from '@pulumi/aws';
