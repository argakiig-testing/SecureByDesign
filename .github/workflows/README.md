# GitHub Actions Workflows

This directory contains automated workflows for the Modular Pulumi AWS Framework.

## 🔄 Workflows Overview

### 1. CI Workflow (`ci.yml`)

**Purpose**: Comprehensive continuous integration pipeline  
**Triggers**: Push to main/develop, Pull requests  
**Duration**: ~5-10 minutes

#### Jobs:
- **Code Quality**: ESLint, Prettier, dependency audit
- **Test & Build**: Multi-version Node.js testing, coverage reporting
- **TypeScript Check**: Compilation validation
- **Pulumi Validation**: Infrastructure code validation
- **Documentation**: README and package validation
- **Performance**: Bundle size and import performance checks

#### Features:
- ✅ Runs on Node.js 18 and 20
- ✅ Uploads coverage to Codecov
- ✅ Validates Pulumi examples
- ✅ Checks for TODO comments in production code
- ✅ Performance and bundle size monitoring

### 2. Release Workflow (`release.yml`)

**Purpose**: Automated package publishing and release management  
**Triggers**: Version tags (v*.*.*), GitHub releases  
**Duration**: ~10-15 minutes

#### Jobs:
- **Validate Release**: Version validation and testing
- **Build Release**: Create distribution packages
- **Security Scan**: Pre-release security checks
- **Publish npm**: Release to npm registry
- **Publish GitHub**: Release to GitHub Packages
- **GitHub Release**: Create release notes and assets
- **Post-release**: Notifications and status updates

#### Features:
- ✅ Supports prerelease versions (alpha, beta, rc)
- ✅ Auto-generates changelogs
- ✅ Creates GitHub releases with artifacts
- ✅ Publishes to both npm and GitHub Packages
- ✅ Version validation and security checks

### 3. Security Workflow (`security.yml`)

**Purpose**: Automated security scanning and vulnerability detection  
**Triggers**: Daily schedule, Push to main, Pull requests, Manual  
**Duration**: ~5-15 minutes

#### Jobs:
- **Dependency Scan**: npm audit for vulnerabilities
- **License Scan**: License compliance checking
- **Code Security**: Security linting and secret detection
- **Dependency Updates**: Weekly update checking
- **Container Security**: Docker image scanning (if applicable)
- **Security Summary**: Consolidated reporting
- **Security Alerting**: Failure notifications

#### Features:
- ✅ Daily automated scans
- ✅ Vulnerability severity thresholds
- ✅ License compliance validation
- ✅ Secret detection patterns
- ✅ Automated security reporting

## 📋 Workflow Dependencies

### Required Secrets

For the workflows to function properly, configure these secrets in your repository:

```bash
# npm publishing (optional)
NPM_TOKEN=your_npm_token

# GitHub token (automatically provided)
GITHUB_TOKEN=automatically_provided

# Additional integrations (optional)
CODECOV_TOKEN=your_codecov_token
SLACK_WEBHOOK=your_slack_webhook  # For notifications
```

### Required Permissions

The workflows require these permissions:

```yaml
permissions:
  contents: write      # For creating releases
  packages: write      # For publishing packages
  security-events: write  # For security scanning
  actions: read        # For workflow access
  checks: write        # For status checks
```

## 🚀 Usage Examples

### Triggering a Release

1. **Update version** in `package.json`
2. **Commit changes**: `git commit -m "chore: bump version to 1.2.3"`
3. **Create tag**: `git tag v1.2.3`
4. **Push tag**: `git push origin v1.2.3`
5. **Create GitHub release** (triggers publishing)

### Manual Security Scan

```bash
# Trigger via GitHub UI or API
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/OWNER/REPO/actions/workflows/security.yml/dispatches \
  -d '{"ref":"main"}'
```

### Local Development

Use the Makefile to run similar checks locally:

```bash
# Run full CI pipeline locally
make ci

# Individual checks
make lint
make test-coverage
make security-check
```

## 🔧 Workflow Configuration

### Customizing CI

Edit `.github/workflows/ci.yml`:

```yaml
# Change Node.js versions
strategy:
  matrix:
    node-version: ['18', '20', '22']  # Add Node 22

# Modify test coverage threshold
- name: Check coverage threshold
  run: |
    COVERAGE=$(jq '.total.statements.pct' coverage/coverage-summary.json)
    if [ "$COVERAGE" -lt 80 ]; then  # Change threshold
      echo "Coverage $COVERAGE% below threshold"
      exit 1
    fi
```

### Customizing Security

Edit `.github/workflows/security.yml`:

```yaml
# Change scan frequency
on:
  schedule:
    - cron: '0 6 * * *'  # Daily at 6 AM instead of 2 AM

# Modify vulnerability thresholds
if [ "$CRITICAL_VULN" -gt 0 ]; then    # Block on any critical
if [ "$HIGH_VULN" -gt 3 ]; then       # Allow up to 3 high severity
```

### Customizing Dependabot

Edit `.github/dependabot.yml`:

```yaml
# Change update frequency
schedule:
  interval: "daily"  # Instead of weekly

# Add new package groups
groups:
  react-ecosystem:
    patterns:
      - "react"
      - "@types/react*"
```

## 🐛 Troubleshooting

### Common Issues

#### CI Failures

**Linting Errors**:
```bash
# Fix locally first
make lint-fix
make format
```

**Test Failures**:
```bash
# Debug failing tests
make test-watch
npm test -- --verbose
```

**Build Errors**:
```bash
# Check TypeScript compilation
make build
npx tsc --noEmit
```

#### Release Failures

**Version Mismatch**:
- Ensure `package.json` version matches git tag
- Use semantic versioning (e.g., `1.2.3`, `1.2.3-beta.1`)

**npm Publishing**:
- Verify NPM_TOKEN is valid
- Check package name availability
- Ensure you have publishing rights

#### Security Scan Issues

**False Positives**:
- Update `.github/workflows/security.yml` patterns
- Whitelist specific files/directories
- Adjust vulnerability thresholds

**Dependency Issues**:
- Review npm audit output
- Update vulnerable dependencies
- Use npm overrides if needed

### Debug Information

Enable debug logging in workflows:

```yaml
# Add to any workflow step
- name: Debug step
  run: |
    echo "Debug information:"
    env | grep GITHUB_
    cat package.json | jq .version
  env:
    ACTIONS_STEP_DEBUG: true
```

## 📊 Monitoring and Metrics

### Workflow Performance

Monitor workflow execution times:
- **CI**: Target < 10 minutes
- **Release**: Target < 15 minutes  
- **Security**: Target < 10 minutes

### Success Rates

Track workflow success rates:
- **CI**: Should be > 95%
- **Release**: Should be > 98%
- **Security**: Should be > 90%

### Cost Optimization

- Use caching for npm dependencies
- Limit parallel jobs based on plan
- Skip unnecessary jobs on documentation-only changes

## 🔮 Future Enhancements

Planned workflow improvements:

- [ ] **E2E Testing**: Full infrastructure deployment tests
- [ ] **Performance Benchmarks**: Automated performance regression detection
- [ ] **Documentation Generation**: Auto-update docs from code
- [ ] **Slack Integration**: Enhanced notification system
- [ ] **Multi-cloud Support**: Azure and GCP pipeline variants

---

For questions about workflows, please open an issue or check the [Contributing Guide](../../CONTRIBUTING.md). 