# Examples

This directory contains working examples demonstrating how to use the Modular Pulumi AWS Framework modules.

## 🚀 Getting Started

### Prerequisites

1. **Pulumi CLI** installed
2. **AWS credentials** configured (`aws configure` or environment variables)
3. **Node.js 18+** installed
4. **Dependencies** installed (`npm install` from project root)

### Running Examples

Each example is a self-contained Pulumi program:

```bash
# Navigate to project root
cd ..

# Preview infrastructure changes
pulumi preview --cwd examples/

# Deploy infrastructure
pulumi up --cwd examples/

# Destroy infrastructure
pulumi destroy --cwd examples/
```

## 📁 Available Examples

### `basic-vpc.ts`

Creates a secure VPC with default configuration.

**Resources Created:**

- VPC with DNS support enabled
- Public and private subnets across 2 AZs
- Internet Gateway for public access
- NAT Gateway for secure outbound access
- Route tables with proper routing

**Use Case:** Development environments, getting started

**Estimated Cost:** ~$45/month (NAT Gateway)

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

Validate examples before deployment:

```bash
# Lint examples
npm run lint examples/

# Type check
npm run build

# Test with preview
pulumi preview --cwd examples/
```

## 💰 Cost Management

Monitor costs when running examples:

| Example     | Est. Monthly Cost | Primary Cost Drivers                 |
| ----------- | ----------------- | ------------------------------------ |
| `basic-vpc` | ~$45              | NAT Gateway ($32), Elastic IP ($3.6) |

**Cost Optimization Tips:**

- Set `multiAzNatGateway: false` for development
- Use `pulumi destroy` when not needed
- Consider VPC endpoints for AWS services

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
