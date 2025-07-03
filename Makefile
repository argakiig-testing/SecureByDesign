# Modular Pulumi AWS Framework - Makefile
# Automates common development tasks

.PHONY: help setup install build test test-watch test-coverage lint lint-fix format format-check clean preview up destroy deps-update deps-audit security-check all ci

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
NC := \033[0m # No Color

# Variables
NODE_VERSION := $(shell node --version 2>/dev/null)
NPM_VERSION := $(shell npm --version 2>/dev/null)
PULUMI_VERSION := $(shell pulumi version --client 2>/dev/null)

##@ Help
help: ## Display this help message
	@echo "$(BLUE)Modular Pulumi AWS Framework$(NC)"
	@echo "$(GREEN)Secure-by-default AWS infrastructure made simple$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "Usage:\n  make $(BLUE)<target>$(NC)\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  $(BLUE)%-15s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(YELLOW)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Setup
setup: ## Complete project setup (install deps, build, test)
	@echo "$(GREEN)Setting up Modular Pulumi AWS Framework...$(NC)"
	@$(MAKE) check-prereqs
	@$(MAKE) install
	@$(MAKE) build
	@$(MAKE) test
	@echo "$(GREEN)✅ Setup complete!$(NC)"

check-prereqs: ## Check if required tools are installed
	@echo "$(BLUE)Checking prerequisites...$(NC)"
ifdef NODE_VERSION
	@echo "$(GREEN)✅ Node.js: $(NODE_VERSION)$(NC)"
else
	@echo "$(RED)❌ Node.js not found. Please install Node.js 18+$(NC)" && exit 1
endif
ifdef NPM_VERSION
	@echo "$(GREEN)✅ npm: $(NPM_VERSION)$(NC)"
else
	@echo "$(RED)❌ npm not found. Please install npm$(NC)" && exit 1
endif
ifdef PULUMI_VERSION
	@echo "$(GREEN)✅ Pulumi: $(PULUMI_VERSION)$(NC)"
else
	@echo "$(YELLOW)⚠️  Pulumi not found. Install from https://www.pulumi.com/docs/get-started/install/$(NC)"
endif

install: ## Install dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	npm ci
	@echo "$(GREEN)✅ Dependencies installed$(NC)"

##@ Development
build: ## Build TypeScript project
	@echo "$(BLUE)Building project...$(NC)"
	npm run build
	@echo "$(GREEN)✅ Build complete$(NC)"

build-watch: ## Build project in watch mode
	@echo "$(BLUE)Starting build in watch mode...$(NC)"
	npm run dev

clean: ## Clean build artifacts
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	rm -rf dist/
	rm -rf coverage/
	rm -rf .pulumi/
	@echo "$(GREEN)✅ Clean complete$(NC)"

##@ Testing
test: ## Run tests
	@echo "$(BLUE)Running tests...$(NC)"
	npm test
	@echo "$(GREEN)✅ Tests complete$(NC)"

test-unit: ## Run unit tests only
	@echo "$(BLUE)Running unit tests...$(NC)"
	npm run test:unit
	@echo "$(GREEN)✅ Unit tests complete$(NC)"

test-integration: ## Run integration tests (requires LocalStack)
	@echo "$(BLUE)Running integration tests...$(NC)"
	@echo "$(YELLOW)⚠️  Integration tests require LocalStack to be running$(NC)"
	npm run test:integration
	@echo "$(GREEN)✅ Integration tests complete$(NC)"

test-integration-local: ## Run integration tests with LocalStack startup
	@echo "$(BLUE)Running integration tests with LocalStack...$(NC)"
	npm run test:integration:local
	@echo "$(GREEN)✅ Integration tests with LocalStack complete$(NC)"

test-watch: ## Run tests in watch mode
	@echo "$(BLUE)Starting tests in watch mode...$(NC)"
	npm run test:watch

test-coverage: ## Run tests with coverage report
	@echo "$(BLUE)Running tests with coverage...$(NC)"
	npm run test:coverage
	@echo "$(GREEN)✅ Coverage report generated in coverage/$(NC)"

##@ Code Quality
lint: ## Run ESLint
	@echo "$(BLUE)Running linter...$(NC)"
	npm run lint
	@echo "$(GREEN)✅ Linting complete$(NC)"

lint-fix: ## Run ESLint with auto-fix
	@echo "$(BLUE)Running linter with auto-fix...$(NC)"
	npm run lint:fix
	@echo "$(GREEN)✅ Linting and fixes complete$(NC)"

format: ## Format code with Prettier
	@echo "$(BLUE)Formatting code...$(NC)"
	npm run format
	@echo "$(GREEN)✅ Code formatted$(NC)"

format-check: ## Check code formatting
	@echo "$(BLUE)Checking code formatting...$(NC)"
	npm run format:check
	@echo "$(GREEN)✅ Format check complete$(NC)"

##@ Security
deps-audit: ## Audit dependencies for vulnerabilities
	@echo "$(BLUE)Auditing dependencies...$(NC)"
	npm audit --audit-level=moderate
	@echo "$(GREEN)✅ Dependency audit complete$(NC)"

deps-update: ## Update dependencies to latest versions
	@echo "$(BLUE)Updating dependencies...$(NC)"
	npm update
	@echo "$(GREEN)✅ Dependencies updated$(NC)"

security-check: ## Run comprehensive security checks
	@echo "$(BLUE)Running security checks...$(NC)"
	@$(MAKE) deps-audit
	@$(MAKE) lint
	@echo "$(GREEN)✅ Security checks complete$(NC)"

##@ LocalStack Operations
localstack-start: ## Start LocalStack for testing
	@echo "$(BLUE)Starting LocalStack...$(NC)"
	docker compose up -d localstack
	@echo "$(YELLOW)Waiting for LocalStack to be ready...$(NC)"
	@sleep 10
	@echo "$(GREEN)✅ LocalStack started$(NC)"

localstack-stop: ## Stop LocalStack
	@echo "$(BLUE)Stopping LocalStack...$(NC)"
	docker compose down
	@echo "$(GREEN)✅ LocalStack stopped$(NC)"

localstack-status: ## Check LocalStack status
	@echo "$(BLUE)Checking LocalStack status...$(NC)"
	@if docker compose ps localstack | grep -q "Up"; then \
		echo "$(GREEN)✅ LocalStack is running$(NC)"; \
		curl -s http://localhost:4566/_localstack/health | jq -r '.services | to_entries[] | "\(.key): \(.value)"' || echo "Health check failed"; \
	else \
		echo "$(RED)❌ LocalStack is not running$(NC)"; \
	fi

localstack-logs: ## Show LocalStack logs
	@echo "$(BLUE)LocalStack logs:$(NC)"
	docker compose logs -f localstack

localstack-reset: ## Reset LocalStack (stop, remove, start)
	@echo "$(BLUE)Resetting LocalStack...$(NC)"
	docker compose down
	docker compose rm -f localstack
	docker compose up -d localstack
	@echo "$(GREEN)✅ LocalStack reset complete$(NC)"

##@ Pulumi Operations
preview: ## Preview infrastructure changes (examples)
	@echo "$(BLUE)Previewing infrastructure changes...$(NC)"
	@if [ ! -f "examples/Pulumi.yaml" ]; then \
		echo "$(YELLOW)⚠️  No Pulumi project found in examples/. Creating...$(NC)"; \
		cd examples && pulumi new --force --yes --name examples --description "ModInfra Examples" --stack dev --config aws:region=us-east-1; \
	fi
	cd examples && pulumi preview
	@echo "$(GREEN)✅ Preview complete$(NC)"

preview-local: ## Preview infrastructure changes against LocalStack
	@echo "$(BLUE)Previewing infrastructure changes against LocalStack...$(NC)"
	@$(MAKE) localstack-start
	@if [ ! -f "examples/Pulumi.yaml" ]; then \
		echo "$(YELLOW)⚠️  No Pulumi project found in examples/. Creating...$(NC)"; \
		cd examples && pulumi new --force --yes --name examples --description "ModInfra Examples" --stack dev --config aws:region=us-east-1; \
	fi
	cd examples && AWS_ENDPOINT_URL=http://localhost:4566 pulumi preview
	@echo "$(GREEN)✅ Preview against LocalStack complete$(NC)"

up: ## Deploy infrastructure (examples)
	@echo "$(BLUE)Deploying infrastructure...$(NC)"
	@echo "$(YELLOW)⚠️  This will deploy real AWS resources and incur costs!$(NC)"
	@read -p "Continue? (y/N): " confirm && [ "$$confirm" = "y" ]
	cd examples && pulumi up
	@echo "$(GREEN)✅ Deployment complete$(NC)"

destroy: ## Destroy infrastructure (examples)
	@echo "$(BLUE)Destroying infrastructure...$(NC)"
	@echo "$(RED)⚠️  This will permanently delete AWS resources!$(NC)"
	@read -p "Continue? (y/N): " confirm && [ "$$confirm" = "y" ]
	cd examples && pulumi destroy
	@echo "$(GREEN)✅ Destruction complete$(NC)"

stack-info: ## Show Pulumi stack information
	@if [ -d "examples/.pulumi" ]; then \
		cd examples && pulumi stack; \
	else \
		echo "$(YELLOW)No Pulumi stack found in examples/$(NC)"; \
	fi

##@ CI/CD
ci: ## Run full CI pipeline (tests, lint, build)
	@echo "$(BLUE)Running CI pipeline...$(NC)"
	@$(MAKE) check-prereqs
	@$(MAKE) install
	@$(MAKE) lint
	@$(MAKE) format-check
	@$(MAKE) build
	@$(MAKE) test-coverage
	@$(MAKE) security-check
	@echo "$(GREEN)✅ CI pipeline complete$(NC)"

all: ## Run complete workflow (clean, install, build, test, lint)
	@echo "$(BLUE)Running complete workflow...$(NC)"
	@$(MAKE) clean
	@$(MAKE) install
	@$(MAKE) build
	@$(MAKE) lint
	@$(MAKE) format-check
	@$(MAKE) test-coverage
	@echo "$(GREEN)✅ Complete workflow finished$(NC)"

##@ Information
info: ## Show project and environment information
	@echo "$(BLUE)Project Information:$(NC)"
	@echo "  Name: $(shell cat package.json | grep '"name"' | cut -d'"' -f4)"
	@echo "  Version: $(shell cat package.json | grep '"version"' | cut -d'"' -f4)"
	@echo "  Node.js: $(NODE_VERSION)"
	@echo "  npm: $(NPM_VERSION)"
	@echo "  Pulumi: $(PULUMI_VERSION)"
	@echo ""
	@echo "$(BLUE)Available Modules:$(NC)"
	@find modules/ -name "index.ts" -exec dirname {} \; | sed 's/modules\//  - /'
	@echo ""
	@echo "$(BLUE)Examples:$(NC)"
	@find examples/ -name "*.ts" -exec basename {} .ts \; | sed 's/^/  - /'

##@ Utilities
watch: ## Watch for changes and rebuild
	@echo "$(BLUE)Watching for changes...$(NC)"
	@echo "$(YELLOW)Press Ctrl+C to stop$(NC)"
	npm run dev

logs: ## Show recent logs (if applicable)
	@echo "$(BLUE)Recent logs:$(NC)"
	@if [ -d "examples/.pulumi" ]; then \
		cd examples && pulumi logs --follow=false; \
	else \
		echo "$(YELLOW)No logs available. Deploy infrastructure first.$(NC)"; \
	fi 