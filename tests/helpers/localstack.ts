/**
 * LocalStack Testing Helpers
 * Utilities for testing with LocalStack AWS service emulation
 */

import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand } from '@aws-sdk/client-ec2';
import { IAMClient } from '@aws-sdk/client-iam';

// Import LocalStack config (JavaScript module)
const localstackConfig = require('../../localstack.config.js');

/**
 * Create AWS clients configured for LocalStack
 */
export function createLocalStackClients() {
  const clientConfig = {
    region: localstackConfig.aws.region,
    credentials: {
      accessKeyId: localstackConfig.aws.accessKeyId,
      secretAccessKey: localstackConfig.aws.secretAccessKey,
    },
    endpoint: localstackConfig.endpoint,
    forcePathStyle: true,
  };

  return {
    ec2: new EC2Client(clientConfig),
    iam: new IAMClient(clientConfig),
  };
}

/**
 * Wait for a condition to be true with retries
 */
export async function waitForCondition(
  condition: () => Promise<boolean>,
  options: {
    maxAttempts?: number;
    delay?: number;
    timeout?: number;
  } = {}
): Promise<void> {
  const { maxAttempts = 10, delay = 1000, timeout = 30000 } = options;
  const startTime = Date.now();

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Timeout waiting for condition after ${timeout}ms`);
    }

    try {
      if (await condition()) {
        return;
      }
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
    }

    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error(`Condition not met after ${maxAttempts} attempts`);
}

/**
 * Verify VPC exists in LocalStack
 */
export async function verifyVpcExists(ec2Client: EC2Client, vpcId: string): Promise<boolean> {
  try {
    const response = await ec2Client.send(
      new DescribeVpcsCommand({
        VpcIds: [vpcId],
      })
    );
    return Boolean(response.Vpcs && response.Vpcs.length > 0);
  } catch {
    return false;
  }
}

/**
 * Verify subnet exists in LocalStack
 */
export async function verifySubnetExists(ec2Client: EC2Client, subnetId: string): Promise<boolean> {
  try {
    const response = await ec2Client.send(
      new DescribeSubnetsCommand({
        SubnetIds: [subnetId],
      })
    );
    return Boolean(response.Subnets && response.Subnets.length > 0);
  } catch {
    return false;
  }
}

/**
 * Get VPC details from LocalStack
 */
export async function getVpcDetails(ec2Client: EC2Client, vpcId: string) {
  const response = await ec2Client.send(
    new DescribeVpcsCommand({
      VpcIds: [vpcId],
    })
  );

  if (!response.Vpcs || response.Vpcs.length === 0) {
    throw new Error(`VPC ${vpcId} not found`);
  }

  return response.Vpcs[0];
}

/**
 * Get all subnets for a VPC
 */
export async function getVpcSubnets(ec2Client: EC2Client, vpcId: string) {
  const response = await ec2Client.send(
    new DescribeSubnetsCommand({
      Filters: [
        {
          Name: 'vpc-id',
          Values: [vpcId],
        },
      ],
    })
  );

  return response.Subnets || [];
}

/**
 * Clean up resources (useful for test cleanup)
 */
export async function cleanupTestResources(resourceIds: {
  vpcs?: string[];
  subnets?: string[];
}): Promise<void> {
  // Note: In LocalStack, resources are typically cleaned up automatically
  // but we can implement specific cleanup logic if needed
  // const { ec2 } = createLocalStackClients(); // Uncomment when needed

  try {
    if (resourceIds.vpcs) {
      for (const vpcId of resourceIds.vpcs) {
        // In a real scenario, we'd delete the VPC and associated resources
        console.log(`Would clean up VPC: ${vpcId}`);
      }
    }

    if (resourceIds.subnets) {
      for (const subnetId of resourceIds.subnets) {
        console.log(`Would clean up subnet: ${subnetId}`);
      }
    }
  } catch (error) {
    console.warn('Error during cleanup:', error);
    // Don't fail tests due to cleanup errors
  }
}

/**
 * Retry wrapper for operations that might fail temporarily
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, delay = 1000 } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but TypeScript requires it
  throw new Error('Retry operation failed');
}

/**
 * Generate unique test resource names
 */
export function generateTestResourceName(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-test-${timestamp}-${random}`;
}
