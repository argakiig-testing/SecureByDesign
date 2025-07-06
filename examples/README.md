# Examples

This directory contains working examples demonstrating how to use the Modular Pulumi AWS Framework modules.

## 📁 Structure

The examples directory is set up as a complete Pulumi project:

```
examples/
├── index.ts          # Main entry point (imports all examples)
├── vpc/              # VPC examples
│   ├── basic-vpc.ts           # Basic secure VPC
│   ├── advanced-vpc.ts        # High-availability VPC
│   ├── multi-region-vpc.ts    # Multi-region setup
│   └── cost-optimized-vpc.ts  # Cost-optimized configurations
├── s3/               # S3 examples
│   ├── basic-bucket.ts        # Basic secure bucket
│   ├── advanced-bucket.ts     # Advanced configuration
│   ├── website-bucket.ts      # Static website hosting
│   └── backup-bucket.ts       # Backup and archival
├── package.json      # Pulumi dependencies
├── tsconfig.json     # TypeScript configuration
├── Pulumi.yaml       # Pulumi project configuration
└── README.md         # This file
```

## 🚀 Getting Started

### Prerequisites

1. **Pulumi CLI** installed
2. **AWS credentials** configured (`aws configure` or environment variables)
3. **Node.js 18+** installed
4. **Project setup complete** (`make setup` from project root)
5. **Dependencies** installed in examples directory (`npm install` here)

### Running Examples

Examples are run through the main project's Makefile commands:

```bash
# From the project root:

# Preview infrastructure against LocalStack (no costs)
make preview-local

# Preview infrastructure changes
make preview

# Deploy infrastructure (costs apply!)
make up

# Destroy infrastructure
make destroy

# Show stack information
make stack-info
```

Or run Pulumi commands directly from examples directory:

```bash
# From examples/ directory:

# Preview infrastructure changes
PULUMI_CONFIG_PASSPHRASE="dev" pulumi preview

# Deploy infrastructure
PULUMI_CONFIG_PASSPHRASE="dev" pulumi up

# Destroy infrastructure
PULUMI_CONFIG_PASSPHRASE="dev" pulumi destroy
```

## 📁 Available Examples

### VPC Examples

#### `vpc/basic-vpc.ts`

Creates a secure VPC with default configuration.

**Resources Created:**

- VPC with DNS support enabled
- Public and private subnets across 2 AZs
- Internet Gateway for public access
- NAT Gateway for secure outbound access
- Route tables with proper routing

**Use Case:** Development environments, getting started

**Estimated Cost:** ~$45/month (NAT Gateway)

#### `vpc/advanced-vpc.ts`

High-availability VPC with advanced configuration.

**Resources Created:**

- VPC across 3 availability zones
- Multi-AZ NAT Gateways for redundancy
- Custom CIDR blocks
- Comprehensive tagging strategy

**Use Case:** Production environments, high availability

**Estimated Cost:** ~$135/month (3 NAT Gateways)

#### `vpc/multi-region-vpc.ts`

Demonstrates VPC setup for multi-region deployment.

**Resources Created:**

- Primary region VPC with full redundancy
- Secondary region VPC configuration
- Non-overlapping CIDR blocks
- Preparation for cross-region connectivity

**Use Case:** Global applications, disaster recovery

**Estimated Cost:** ~$180/month (multiple regions)

#### `vpc/cost-optimized-vpc.ts`

Cost-optimized VPC configurations for development.

**Resources Created:**

- Development VPC with single NAT Gateway
- Test VPC with no NAT Gateway
- Minimal subnet configurations
- Cost optimization tags

**Use Case:** Development, testing, cost-sensitive environments

**Estimated Cost:** ~$22/month (dev) + ~$0/month (test)

### S3 Examples

#### `s3/basic-bucket.ts`

Basic secure S3 bucket with default security settings.

**Resources Created:**

- S3 bucket with AES256 encryption
- Versioning enabled
- Public access blocked
- Intelligent tiering lifecycle rules

**Use Case:** Document storage, file uploads

**Estimated Cost:** ~$1-5/month (depending on storage)

#### `s3/advanced-bucket.ts`

Advanced S3 configuration with custom settings.

**Resources Created:**

- S3 bucket with KMS encryption
- Custom lifecycle rules for cost optimization
- CORS configuration for web applications
- Access logging setup

**Use Case:** Data platform, web application storage

**Estimated Cost:** ~$5-20/month (depending on storage and KMS usage)

#### `s3/website-bucket.ts`

Static website hosting with S3.

**Resources Created:**

- S3 bucket configured for website hosting
- Website configuration with error pages
- CloudFront-friendly security policies
- CORS setup for web browsers

**Use Case:** Static websites, documentation sites

**Estimated Cost:** ~$1-10/month (storage + data transfer)

#### `s3/backup-bucket.ts`

Backup and archival storage optimization.

**Resources Created:**

- S3 bucket with aggressive archival lifecycle
- Event notifications for monitoring
- Enhanced security for sensitive data
- Role-based access control

**Use Case:** Backup systems, data archival

**Estimated Cost:** ~$0.50-5/month (mostly in Glacier/Deep Archive)

## 🔧 Customizing Examples

You can modify any example to suit your needs:

```typescript
// Customize the VPC configuration
const network = new VpcComponent('example', {
  name: 'my-custom-vpc',
  cidrBlock: '172.16.0.0/16', // Different CIDR
  availabilityZoneCount: 3, // More AZs
  multiAzNatGateway: true, // High availability
  tags: {
    Environment: 'production',
    Team: 'platform',
  },
});

// Or start with a cost-optimized configuration
const devNetwork = new VpcComponent('dev', {
  name: 'dev-vpc',
  cidrBlock: '10.10.0.0/16',
  enableNatGateway: true,
  multiAzNatGateway: false, // Single NAT for cost savings
  availabilityZoneCount: 2,
});
```

## 📊 Outputs

Each example exports key outputs you can use:

```bash
# View outputs after deployment
pulumi stack output

# Get specific output
pulumi stack output vpcId
```

## 🏗️ Building on Examples

Use example outputs in your own infrastructure:

```typescript
// Reference deployed VPC in another stack
import { StackReference } from '@pulumi/pulumi';

const infraStack = new StackReference('my-org/basic-vpc/dev');
const vpcId = infraStack.getOutput('vpcId');
const privateSubnets = infraStack.getOutput('privateSubnetIds');

// Use in your application stack
const service = new EcsService('app', {
  vpc: vpcId,
  subnets: privateSubnets,
});
```

## 🧪 Testing Examples

### Development and Validation

From the project root, use the comprehensive testing workflow:

```bash
# Complete validation (recommended)
make ci

# Individual validation steps
make build               # Build TypeScript and validate imports
make preview-local       # Preview infrastructure against LocalStack (no costs)
make lint                # Lint all code including examples

# Test against LocalStack (no AWS costs)
make preview-local       # Preview infrastructure against LocalStack
```

### Manual Testing

```bash
# From project root - preview Pulumi program structure
make preview-local

# From examples directory - preview specific changes
cd examples
PULUMI_CONFIG_PASSPHRASE="dev" pulumi preview
```

## 💰 Cost Management

Monitor costs when running examples:

| Example                  | Est. Monthly Cost | Primary Cost Drivers                      |
| ------------------------ | ----------------- | ----------------------------------------- |
| `vpc/basic-vpc`          | ~$45              | NAT Gateway ($32), Elastic IP ($3.6)      |
| `vpc/advanced-vpc`       | ~$135             | 3 NAT Gateways ($96), 3 Elastic IPs ($11) |
| `vpc/multi-region-vpc`   | ~$180             | Multiple regions, NAT Gateways            |
| `vpc/cost-optimized-vpc` | ~$22              | Single NAT Gateway, minimal resources     |
| `s3/basic-bucket`        | ~$1-5             | Storage ($0.023/GB), requests             |
| `s3/advanced-bucket`     | ~$5-20            | Storage, KMS requests, data transfer      |
| `s3/website-bucket`      | ~$1-10            | Storage, data transfer                    |
| `s3/backup-bucket`       | ~$0.50-5          | Glacier/Deep Archive storage ($0.004/GB)  |

**Cost Optimization Tips:**

- Use `vpc/cost-optimized-vpc.ts` for development environments
- Set `multiAzNatGateway: false` to reduce NAT Gateway costs
- Consider `enableNatGateway: false` for testing (use VPC endpoints)
- Use `pulumi destroy` when not needed
- Consider VPC endpoints for AWS services to reduce NAT Gateway usage

## 🚨 Cleanup

Always clean up resources when done:

```bash
# Destroy all resources
pulumi destroy --cwd examples/

# Verify cleanup
pulumi stack --show-urns
```

## 📚 Next Steps

1. **Explore the VPC module** documentation in `modules/vpc/README.md`
2. **Combine modules** as more become available
3. **Create your own examples** for specific use cases
4. **Contribute back** improvements and new examples

---

For questions or issues, please open an issue in the main repository.
