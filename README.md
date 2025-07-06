# Modular Pulumi AWS Framework

**Secure-by-default AWS infrastructure made simple.**

This framework provides opinionated, modular Pulumi components to rapidly bootstrap secure AWS environments — with minimal configuration and maximum safety.

## 🚀 Goals

- **Secure by Design**: Security best practices baked into every module.
- **Minimal Configuration**: Just enough required config to deploy safely.
- **Modular Architecture**: Mix and match reusable infrastructure components.
- **For Everyone**: Designed to be usable by teams unfamiliar with cloud security.

---

## 🧱 What's Included

| Module       | Description                                            |
| ------------ | ------------------------------------------------------ |
| `vpc`        | Secure private networking with NAT gateway and subnets |
| `ecs`        | ECS Fargate service with logging and IAM roles         |
| `s3`         | Secure, encrypted buckets with versioning              |
| `iam`        | Least-privilege roles and policies for services/users  |
| `rds`        | Encrypted PostgreSQL or MySQL with secret rotation     |
| `cloudfront` | Secure CDN distribution with HTTPS enforcement         |
| `cloudwatch` | Preconfigured logs, metrics, alarms                    |

> ✫️ All modules block public access, enforce encryption, and are tagged for auditing.

---

## 🛠️ Getting Started

### 1. Prerequisites

- [Pulumi CLI](https://www.pulumi.com/docs/get-started/install/)
- AWS credentials via `aws configure` or environment variables
- Node.js 18+
- Docker (for local testing with LocalStack)

### 2. Clone and Setup

```bash
git clone https://github.com/your-org/modular-pulumi-aws-framework.git
cd modular-pulumi-aws-framework
make setup
```

### 3. Test the Framework

```bash
# Preview infrastructure against LocalStack (no AWS costs)
make preview-local

# Run complete development workflow
make ci
```

### 4. Try the Examples

```bash
# Preview example infrastructure against LocalStack
make preview-local

# Preview against real AWS (no costs, just preview)
make preview

# Deploy example infrastructure (optional - costs apply)
make up
```

---

## ✍️ Example

```ts
import { VpcComponent } from 'modular-pulumi-aws-framework';

// Create a secure VPC with secure defaults
const network = new VpcComponent('example', {
  name: 'example',
  tags: {
    Environment: 'development',
    Project: 'modinfra-example',
    Owner: 'platform-team',
  },
});

// Export outputs for use by other stacks
export const vpcId = network.vpcId;
export const publicSubnetIds = network.publicSubnetIds;
export const privateSubnetIds = network.privateSubnetIds;
```

---

## 🧪 Local Development & Testing

### Development Workflow

The framework includes a comprehensive development workflow with LocalStack testing:

```bash
# Complete development pipeline
make ci                   # Run tests, lint, build, preview-local

# Individual development steps
make build                # Build TypeScript
make test                 # Run all tests
make lint                 # Run linting
make preview-local        # Preview infrastructure against LocalStack
```

### Testing Without AWS Costs

This framework supports **LocalStack** for local testing without incurring AWS charges:

```bash
# Start LocalStack for local testing
make localstack-start

# Run integration tests against LocalStack
make test-integration

# Preview infrastructure against LocalStack
make preview-local

# Stop LocalStack when done
make localstack-stop
```

### Available Test Commands

```bash
make test                 # Run all tests (unit + integration)
make test-unit            # Run unit tests only
make test-integration     # Run integration tests (requires LocalStack)
make test-integration-local  # Run integration tests with automatic LocalStack startup
```

### LocalStack Management

```bash
make localstack-start     # Start LocalStack
make localstack-stop      # Stop LocalStack
make localstack-status    # Check LocalStack status
make localstack-logs      # View LocalStack logs
make localstack-reset     # Reset LocalStack (clean restart)
```

### Pulumi Operations

```bash
make preview              # Preview infrastructure changes
make preview-local        # Preview against LocalStack (no costs)
make up                   # Deploy infrastructure (real AWS - costs apply)
make destroy              # Destroy infrastructure
make stack-info           # Show current stack information
```

---

## 📀 Design Principles

- **Secure Defaults**: Every module makes the secure choice the easy choice.
- **Convention over Configuration**: Fewer options, better defaults.
- **Auditable Outputs**: All resources are tagged and monitored.
- **Composable Infrastructure**: Modules don't assume your layout — they adapt to it.

---

## 📋 Roadmap

- [ ] CLI scaffolding (`modinfra new project`)
- [ ] Optional dashboard with metrics

---

## 🧠 Contributing

Contributions welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) and open a discussion or PR.

---

## 📄 License

MIT © 2025 Modular Pulumi Contributors
