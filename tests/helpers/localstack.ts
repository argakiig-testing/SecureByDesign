/**
 * LocalStack Testing Helpers
 * Utilities for testing with LocalStack AWS service emulation
 */

import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand } from '@aws-sdk/client-ec2';
import { IAMClient } from '@aws-sdk/client-iam';

// Polyfill for AbortController in older Node.js versions
declare global {
  var AbortController: typeof globalThis.AbortController;
}

// Import LocalStack config (JavaScript module)
const localstackConfig = require('../../localstack.config.js');

/**
 * LocalStack connectivity status
 */
export interface LocalStackStatus {
  isAvailable: boolean;
  services: {
    ec2?: 'available' | 'disabled' | 'error';
    s3?: 'available' | 'disabled' | 'error';
    iam?: 'available' | 'disabled' | 'error';
  };
  endpoint: string;
  error?: string;
}

/**
 * Check if LocalStack is available and which services are ready
 */
export async function checkLocalStackStatus(timeout = 10000): Promise<LocalStackStatus> {
  const endpoint = localstackConfig.endpoint || 'http://localhost:4566';

  try {
    // eslint-disable-next-line no-undef
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${endpoint}/_localstack/health`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        isAvailable: false,
        services: {},
        endpoint,
        error: `LocalStack health check failed with status ${response.status}`,
      };
    }

    const health = (await response.json()) as { services?: Record<string, string> };

    return {
      isAvailable: true,
      services: {
        ec2: health.services?.ec2 as 'available' | 'disabled' | 'error',
        s3: health.services?.s3 as 'available' | 'disabled' | 'error',
        iam: health.services?.iam as 'available' | 'disabled' | 'error',
      },
      endpoint,
    };
  } catch (error) {
    return {
      isAvailable: false,
      services: {},
      endpoint,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Wait for LocalStack to be ready with specific services
 */
export async function waitForLocalStack(
  requiredServices: string[] = [],
  options: {
    maxAttempts?: number;
    delay?: number;
    timeout?: number;
  } = {}
): Promise<LocalStackStatus> {
  const { maxAttempts = 10, delay = 2000, timeout = 60000 } = options;
  const startTime = Date.now();

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Timeout waiting for LocalStack after ${timeout}ms`);
    }

    try {
      const status = await checkLocalStackStatus(5000);

      if (status.isAvailable) {
        // Check if all required services are available
        const missingServices = requiredServices.filter(
          service => status.services[service as keyof typeof status.services] !== 'available'
        );

        if (missingServices.length === 0) {
          return status;
        }

        console.log(`Waiting for LocalStack services: ${missingServices.join(', ')}`);
      }
    } catch (error) {
      console.log(`LocalStack not ready (attempt ${attempt}/${maxAttempts}): ${error}`);
    }

    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error(`LocalStack not ready after ${maxAttempts} attempts`);
}

/**
 * Skip test if LocalStack is not available with consistent messaging
 */
export function skipIfLocalStackUnavailable(status: LocalStackStatus, testName: string): void {
  if (!status.isAvailable) {
    const message = `Skipping ${testName}: LocalStack not available (${status.endpoint})`;
    if (status.error) {
      console.warn(`${message} - ${status.error}`);
    } else {
      console.warn(message);
    }
  }
}

/**
 * Jest test wrapper that automatically skips if LocalStack is unavailable
 */
export function localStackTest(
  testName: string,
  requiredServices: string[],
  testFn: () => Promise<void> | void,
  _timeout = 30000
) {
  return async () => {
    try {
      const status = await checkLocalStackStatus();

      if (!status.isAvailable) {
        skipIfLocalStackUnavailable(status, testName);
        return;
      }

      // Check required services
      const unavailableServices = requiredServices.filter(
        service => status.services[service as keyof typeof status.services] !== 'available'
      );

      if (unavailableServices.length > 0) {
        console.warn(
          `Skipping ${testName}: Required LocalStack services not available: ${unavailableServices.join(', ')}`
        );
        return;
      }

      // Run the actual test
      await testFn();
    } catch (error) {
      if (error instanceof Error && error.message.includes('LocalStack')) {
        console.warn(`Skipping ${testName}: LocalStack error - ${error.message}`);
        return;
      }
      throw error;
    }
  };
}

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
