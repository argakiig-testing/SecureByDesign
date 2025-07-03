# Modular Pulumi AWS Framework

**Secure-by-default AWS infrastructure made simple.**

This framework provides opinionated, modular Pulumi components to rapidly bootstrap secure AWS environments — with minimal configuration and maximum safety.

## 🚀 Goals

- **Secure by Design**: Security best practices baked into every module.
- **Minimal Configuration**: Just enough required config to deploy safely.
- **Modular Architecture**: Mix and match reusable infrastructure components.
- **For Everyone**: Designed to be usable by teams unfamiliar with cloud security.

---

## 🧱 What’s Included

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

### 2. Create Your Stack

```bash
pulumi new aws-typescript -n my-secure-infra
cd my-secure-infra
```

### 3. Add the Framework

```bash
npm install @modinfra/vpc @modinfra/ecs @modinfra/s3
```

> (Coming soon: install as a single umbrella package)

---

## ✍️ Example

```ts
import * as modinfra from '@modinfra';

// Create a secure VPC
const network = new modinfra.Vpc('main', {
  cidrBlock: '10.0.0.0/16',
  enableNatGateway: true,
});

// Deploy a secure ECS service
const service = new modinfra.EcsService('app', {
  vpc: network.vpc,
  containerImage: 'nginx',
});
```

---

## 🧪 Local Development & Testing

### Testing Without AWS Costs

This framework supports **LocalStack** for local testing without incurring AWS charges:

```bash
# Start LocalStack for local testing
make localstack-start

# Run integration tests against LocalStack
npm run test:integration

# Stop LocalStack when done
make localstack-stop
```

### Available Test Commands

```bash
npm run test              # Run all tests (unit + integration)
npm run test:unit         # Run unit tests only
npm run test:integration  # Run integration tests (requires LocalStack)
npm run test:integration:local  # Run integration tests with automatic LocalStack startup
```

### LocalStack Management

```bash
make localstack-start     # Start LocalStack
make localstack-stop      # Stop LocalStack
make localstack-status    # Check LocalStack status
make localstack-logs      # View LocalStack logs
make localstack-reset     # Reset LocalStack (clean restart)
```

---

## 📀 Design Principles

- **Secure Defaults**: Every module makes the secure choice the easy choice.
- **Convention over Configuration**: Fewer options, better defaults.
- **Auditable Outputs**: All resources are tagged and monitored.
- **Composable Infrastructure**: Modules don’t assume your layout — they adapt to it.

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
