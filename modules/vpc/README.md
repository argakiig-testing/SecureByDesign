# VPC Module

> **Secure, production-ready networking infrastructure for AWS**

The VPC module provides a secure-by-default Virtual Private Cloud (VPC) with public and private subnets, NAT Gateway, Internet Gateway, and proper routing. Designed following AWS Well-Architected Framework principles.

## 🎯 Purpose and Use Cases

- **Production workloads** requiring secure network isolation
- **Multi-tier applications** with public load balancers and private application servers
- **Microservices architectures** needing secure service-to-service communication
- **Development environments** that mirror production security posture
- **Compliance-focused** deployments requiring network auditing

## 🏗️ Architecture

```
Internet Gateway
      │
   ┌──┴──┐
   │ AZ-A │     │ AZ-B │
   │      │     │      │
┌──┴─┐ ┌─┴─┐ ┌─┴─┐ ┌─┴─┐
│Pub │ │Pri│ │Pub│ │Pri│  Subnets
│.0  │ │.10│ │.1 │ │.11│
└─┬──┘ └─┬─┘ └─┬─┘ └─┬─┘
  │   NAT  │     │   NAT │
  └────────┘     └───────┘
```

## 🔐 Security Features

### Network Isolation

- **Private subnets by default** - Application workloads run in private subnets
- **No direct internet access** to private resources
- **Controlled outbound access** through NAT Gateway

### Secure Defaults

- **DNS resolution enabled** for service discovery
- **Proper route table isolation** between public/private subnets
- **Resource tagging** for auditing and cost tracking
- **No hardcoded credentials** or security groups

### Compliance

- **RFC 1918 private addressing** (10.0.0.0/16 default)
- **Multi-AZ deployment** for high availability
- **Audit trail** through comprehensive resource tagging

## 📋 Configuration Options

### Required Parameters

| Parameter | Type     | Description                       |
| --------- | -------- | --------------------------------- |
| `name`    | `string` | Name prefix for all VPC resources |

### Optional Parameters

| Parameter               | Type      | Default         | Description                            |
| ----------------------- | --------- | --------------- | -------------------------------------- |
| `cidrBlock`             | `string`  | `"10.0.0.0/16"` | VPC CIDR block (RFC 1918)              |
| `enableDnsHostnames`    | `boolean` | `true`          | Enable DNS hostnames in VPC            |
| `enableDnsSupport`      | `boolean` | `true`          | Enable DNS support in VPC              |
| `enableNatGateway`      | `boolean` | `true`          | Create NAT Gateway for outbound access |
| `multiAzNatGateway`     | `boolean` | `false`         | Create NAT Gateway in each AZ (HA)     |
| `availabilityZoneCount` | `number`  | `2`             | Number of AZs to use                   |
| `tags`                  | `object`  | `{}`            | Additional tags for resources          |

## 🚀 Usage Examples

### Basic VPC

```typescript
import { VpcComponent } from '@modinfra/vpc';

const network = new VpcComponent('main', {
  name: 'main',
});

// Outputs: vpc, publicSubnets, privateSubnets, etc.
export const vpcId = network.vpcId;
export const privateSubnetIds = network.privateSubnetIds;
```

### Production VPC with High Availability

```typescript
import { VpcComponent } from '@modinfra/vpc';

const network = new VpcComponent('production', {
  name: 'production',
  cidrBlock: '10.0.0.0/16',
  availabilityZoneCount: 3,
  multiAzNatGateway: true, // NAT Gateway in each AZ
  tags: {
    Environment: 'production',
    Team: 'platform',
    CostCenter: 'infrastructure',
  },
});
```

### Development VPC (Cost Optimized)

```typescript
import { VpcComponent } from '@modinfra/vpc';

const devNetwork = new VpcComponent('dev', {
  name: 'dev',
  cidrBlock: '10.1.0.0/16',
  availabilityZoneCount: 2,
  multiAzNatGateway: false, // Single NAT Gateway
  tags: {
    Environment: 'development',
    AutoShutdown: 'true',
  },
});
```

### Custom CIDR with Specific Configuration

```typescript
import { VpcComponent } from '@modinfra/vpc';

const customNetwork = new VpcComponent('custom', {
  name: 'custom',
  cidrBlock: '172.16.0.0/16',
  availabilityZoneCount: 4,
  enableNatGateway: true,
  multiAzNatGateway: true,
  tags: {
    Project: 'data-platform',
    Compliance: 'pci-dss',
  },
});
```

## 📤 Outputs

### VPC Resources

| Output            | Type                      | Description              |
| ----------------- | ------------------------- | ------------------------ |
| `vpc`             | `aws.ec2.Vpc`             | The VPC resource         |
| `vpcId`           | `Output<string>`          | VPC ID for other modules |
| `internetGateway` | `aws.ec2.InternetGateway` | Internet Gateway         |

### Subnets

| Output             | Type               | Description              |
| ------------------ | ------------------ | ------------------------ |
| `publicSubnets`    | `aws.ec2.Subnet[]` | Public subnet resources  |
| `privateSubnets`   | `aws.ec2.Subnet[]` | Private subnet resources |
| `publicSubnetIds`  | `Output<string>[]` | Public subnet IDs        |
| `privateSubnetIds` | `Output<string>[]` | Private subnet IDs       |

### Networking

| Output        | Type                    | Description                     |
| ------------- | ----------------------- | ------------------------------- |
| `natGateways` | `aws.ec2.NatGateway[]?` | NAT Gateways (if enabled)       |
| `routeTables` | `object`                | Public and private route tables |

## 🔗 Integration with Other Modules

### ECS Service

```typescript
import { VpcComponent } from '@modinfra/vpc';
import { EcsService } from '@modinfra/ecs';

const network = new VpcComponent('main', { name: 'main' });

const service = new EcsService('app', {
  name: 'app',
  vpc: network.vpc,
  subnets: network.privateSubnetIds, // Deploy in private subnets
});
```

### Application Load Balancer

```typescript
const alb = new aws.lb.LoadBalancer('app-alb', {
  loadBalancerType: 'application',
  subnets: network.publicSubnetIds, // ALB in public subnets
  securityGroups: [
    /* ... */
  ],
});
```

### RDS Database

```typescript
import { RdsCluster } from '@modinfra/rds';

const database = new RdsCluster('db', {
  name: 'db',
  vpc: network.vpc,
  subnets: network.privateSubnetIds, // Database in private subnets
});
```

## 💰 Cost Considerations

| Resource          | Cost Impact | Notes                             |
| ----------------- | ----------- | --------------------------------- |
| **NAT Gateway**   | High        | ~$45/month per gateway            |
| **Elastic IPs**   | Low         | ~$3.6/month per unused IP         |
| **Data Transfer** | Variable    | Outbound data through NAT Gateway |

### Cost Optimization Tips

- Use `multiAzNatGateway: false` for development
- Consider VPC endpoints for AWS services to avoid NAT Gateway costs
- Monitor data transfer costs through CloudWatch

## 🧪 Testing

The VPC module includes comprehensive tests with both unit and integration testing:

### Local Testing with LocalStack

Test VPC creation without AWS costs using LocalStack:

```bash
# Start LocalStack for testing
make localstack-start

# Run integration tests against LocalStack
npm run test:integration

# Or run all tests (unit + integration)
npm test

# Stop LocalStack when done
make localstack-stop
```

### Test Commands

```bash
# Run all tests (unit + integration)
npm test

# Run unit tests only (fast, mocked)
npm run test:unit

# Run integration tests (requires LocalStack)
npm run test:integration

# Run integration tests with automatic LocalStack setup
npm run test:integration:local

# Run tests with coverage
npm run test:coverage

# Test specific module
npm test -- --testNamePattern="VPC"
```

### Test Types

- **Unit Tests** (`vpc.test.ts`): Fast tests using mocks for logic validation
- **Integration Tests** (`vpc.integration.ts`): Real AWS resource creation using LocalStack

## 🚨 Troubleshooting

### Common Issues

**Issue**: Resources can't access the internet

- **Solution**: Verify NAT Gateway is enabled and in public subnet
- **Check**: Route tables have correct 0.0.0.0/0 routes

**Issue**: DNS resolution not working

- **Solution**: Ensure `enableDnsSupport` and `enableDnsHostnames` are true
- **Check**: VPC DNS settings in AWS console

**Issue**: Subnet CIDR conflicts

- **Solution**: Adjust `cidrBlock` to avoid overlaps with existing networks
- **Check**: CIDR calculator for proper subnet sizing

### Debug Information

Enable debug logging:

```typescript
const network = new VpcComponent(
  'debug',
  {
    name: 'debug',
    // ... other config
  },
  {
    // Enable detailed logging
    logLevel: 'debug',
  }
);
```

## 🔄 Migration Guide

### From AWS CDK

```typescript
// CDK
const vpc = new ec2.Vpc(this, 'MyVpc', {
  cidr: '10.0.0.0/16',
  maxAzs: 2,
});

// ModInfra
const vpc = new VpcComponent('my-vpc', {
  name: 'my-vpc',
  cidrBlock: '10.0.0.0/16',
  availabilityZoneCount: 2,
});
```

### From Terraform

```hcl
# Terraform
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
}

# ModInfra equivalent
const vpc = new VpcComponent('main', {
  name: 'main',
  cidrBlock: '10.0.0.0/16',
  enableDnsHostnames: true,
  enableDnsSupport: true,
});
```

---

## 📚 Additional Resources

- [AWS VPC User Guide](https://docs.aws.amazon.com/vpc/latest/userguide/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [Pulumi AWS VPC Documentation](https://www.pulumi.com/docs/reference/pkg/aws/ec2/vpc/)
