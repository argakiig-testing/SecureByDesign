# Contributing to Modular Pulumi AWS Framework

Thank you for your interest in contributing to the **Modular Pulumi AWS Framework**!

We welcome contributions of all kinds — new modules, bug fixes, documentation improvements, and ideas.

## 🧭 How to Contribute

### 1. Fork & Clone

```bash
git clone https://github.com/your-username/modular-pulumi-aws-framework.git
cd modular-pulumi-aws-framework
```

### 2. Setup Development Environment

Complete project setup with all dependencies and tools:

```bash
make setup
```

This will:

- Install npm dependencies
- Build the TypeScript project
- Run initial tests
- Verify all prerequisites

### 3. Set Up LocalStack (Optional)

For local testing without AWS costs, install Docker and set up LocalStack:

```bash
# Start LocalStack
make localstack-start

# Verify LocalStack is running
make localstack-status
```

### 4. Create a New Branch

```bash
git checkout -b feat/your-feature-name
```

### 5. Make Your Changes

- Follow the structure of existing modules.
- Use `tslint` / `eslint` and `prettier` for code consistency.
- Ensure security-first design for all new modules.

### 6. Test Your Code

Run the comprehensive test suite and validation:

```bash
# Run complete CI pipeline (recommended)
make ci

# Or run individual steps:
make build                           # Build TypeScript
make test                           # Run all tests
make lint                           # Run linting
make validate                       # Validate Pulumi infrastructure

# Run tests separately:
npm run test:unit                    # Unit tests only
npm run test:integration:local       # Integration tests with LocalStack
```

Make sure your code compiles and works as expected:

```bash
# Validate infrastructure plan
make validate

# Preview against LocalStack (no costs)
make preview-local

# Preview against real AWS (requires credentials)
make preview
```

### 7. Commit & Push

```bash
git commit -m "feat(vpc): add support for IPv6 CIDR"
git push origin feat/your-feature-name
```

### 8. Open a Pull Request

Go to the GitHub repo and open a PR targeting `main`. Fill in the template and describe your change clearly.

---

## ✅ Contribution Guidelines

- Use **TypeScript** for all modules.
- Keep each module **self-contained and reusable**.
- Enforce **secure defaults**.
- Prefer **composition** over inheritance.
- **Write documentation** for any new module or significant change.
- Use **semantic commit messages**: `feat:`, `fix:`, `docs:`, `refactor:`, etc.

---

## 🧪 Local Development Tips

### Testing Strategy

- **Unit Tests**: Fast, isolated tests using mocks for individual module logic
- **Integration Tests**: Real AWS service interactions using LocalStack
- Use `examples/` directory for testing new modules in isolation

### LocalStack Development Workflow

```bash
# Start development environment
make localstack-start

# Watch for changes and run tests
npm run test:watch

# Check LocalStack status anytime
make localstack-status

# View LocalStack logs for debugging
make localstack-logs

# Reset LocalStack if needed
make localstack-reset

# Stop when done
make localstack-stop
```

### Testing Best Practices

- Write both unit tests (`.test.ts`) and integration tests (`.integration.ts`)
- Unit tests should be fast and test logic without external dependencies
- Integration tests should verify actual AWS resource creation/configuration
- Use environment variables or `Pulumi.<stack>.yaml` for credentials
- Validate your code with `npm run lint && npm run build`

### Available Make Commands

```bash
# Development workflow
make help                 # Show all available commands
make setup               # Complete project setup
make ci                  # Run complete CI pipeline
make build               # Build TypeScript project
make test                # Run all tests
make lint                # Run ESLint
make format              # Format code with Prettier

# Testing
make test-unit           # Run unit tests only
make test-integration    # Run integration tests
make test-integration-local  # Run integration tests with LocalStack startup

# Pulumi operations
make validate            # Validate Pulumi program (same as CI)
make preview             # Preview infrastructure changes
make preview-local       # Preview against LocalStack
make up                  # Deploy infrastructure (real AWS - costs apply)
make destroy             # Destroy infrastructure
make stack-info          # Show stack information

# LocalStack management
make localstack-start    # Start LocalStack
make localstack-stop     # Stop LocalStack
make localstack-status   # Check LocalStack status
make localstack-logs     # View LocalStack logs
make localstack-reset    # Reset LocalStack (clean restart)

# Utilities
make clean               # Clean build artifacts
make info                # Show project information
```

---

## 📬 Questions or Feedback?

Open an [issue](https://github.com/YOUR_ORG/modular-pulumi-aws-framework/issues) or start a [discussion](https://github.com/YOUR_ORG/modular-pulumi-aws-framework/discussions).

---

Thank you for helping make secure AWS infrastructure accessible for everyone! 🙏
