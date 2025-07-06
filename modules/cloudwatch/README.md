# CloudWatch Module

Secure-by-design AWS CloudWatch monitoring and logging module for comprehensive observability.

## Overview

The CloudWatch module provides a complete monitoring and logging solution with secure defaults, automated alerting, and comprehensive dashboards. It follows AWS best practices for observability and includes built-in security features.

## Features

### 🔍 **Comprehensive Monitoring**

- **Log Groups**: Centralized logging with automatic retention management
- **Metric Alarms**: Intelligent alerting with customizable thresholds
- **Dashboards**: Rich visualizations for metrics and logs
- **Composite Alarms**: Complex logic for advanced monitoring scenarios

### 🔐 **Security First**

- **Encryption at Rest**: All log groups encrypted by default
- **IAM Integration**: Least-privilege access patterns
- **Audit Logging**: Comprehensive activity tracking
- **Secure Defaults**: Industry best practices built-in

### 🎯 **Easy to Use**

- **Template-Based**: Pre-configured alarms for common services
- **TypeScript Support**: Full type safety and IntelliSense
- **Validation**: Input validation with helpful error messages
- **Examples**: Working examples for all use cases

### 🚀 **Production Ready**

- **Scalable**: Supports large-scale deployments
- **Reliable**: Battle-tested patterns and configurations
- **Cost-Optimized**: Smart defaults to minimize costs
- **Well-Documented**: Comprehensive guides and API docs

## Installation

```bash
npm install @your-org/pulumi-aws-framework
```

## Quick Start

### Basic Monitoring Setup

```typescript
import {
  CloudWatchComponent,
  LOG_RETENTION_DAYS,
  COMPARISON_OPERATORS,
} from '@your-org/pulumi-aws-framework';

const monitoring = new CloudWatchComponent('my-monitoring', {
  name: 'my-app-monitoring',

  // SNS notifications
  notifications: {
    topicName: 'app-alerts',
    enableEncryption: true,
    emailEndpoints: ['team@company.com'],
  },

  // Log groups
  logGroups: [
    {
      name: '/aws/lambda/my-function',
      retentionInDays: LOG_RETENTION_DAYS.ONE_MONTH,
    },
  ],

  // Metric alarms
  metricAlarms: [
    {
      name: 'function-errors',
      metricName: 'Errors',
      namespace: 'AWS/Lambda',
      threshold: 3,
      comparisonOperator: COMPARISON_OPERATORS.GREATER_THAN_THRESHOLD,
      dimensions: { FunctionName: 'my-function' },
    },
  ],
});
```

### Dashboard Creation

```typescript
const dashboard = new CloudWatchComponent('dashboard', {
  name: 'app-dashboard',

  dashboards: [
    {
      name: 'application-overview',
      widgets: [
        {
          type: 'metric',
          x: 0,
          y: 0,
          width: 12,
          height: 6,
          properties: {
            metrics: [['AWS/Lambda', 'Invocations', 'FunctionName', 'my-function']],
            title: 'Lambda Invocations',
          },
        },
      ],
    },
  ],
});
```

## Usage Examples

### 1. Basic Monitoring

[See complete example](./examples/basic-monitoring.ts)

```typescript
import { CloudWatchComponent, LOG_RETENTION_DAYS } from './index';

const basicMonitoring = new CloudWatchComponent('basic-monitoring', {
  name: 'basic-monitoring',

  notifications: {
    topicName: 'basic-alerts',
    enableEncryption: true,
    emailEndpoints: ['admin@example.com'],
  },

  logGroups: [
    {
      name: '/aws/lambda/my-api-function',
      retentionInDays: LOG_RETENTION_DAYS.ONE_MONTH,
    },
  ],

  metricAlarms: [
    {
      name: 'api-function-errors',
      description: 'Alert when API function has errors',
      metricName: 'Errors',
      namespace: 'AWS/Lambda',
      threshold: 3,
      comparisonOperator: 'GreaterThanOrEqualToThreshold',
      dimensions: { FunctionName: 'my-api-function' },
    },
  ],
});
```

### 2. Advanced Monitoring

[See complete example](./examples/advanced-alarms.ts)

```typescript
import { CloudWatchComponent, createAlarmTemplates } from './index';

// Template-based alarms
const ec2Alarms = createAlarmTemplates({
  ec2: {
    instanceId: 'i-1234567890abcdef0',
    enableCpuAlarm: true,
    cpuThreshold: 85,
    enableMemoryAlarm: true,
    memoryThreshold: 90,
  },
});

const advancedMonitoring = new CloudWatchComponent('advanced-monitoring', {
  name: 'advanced-monitoring',

  // Composite alarms
  compositeAlarms: [
    {
      name: 'api-health-composite',
      description: 'Overall API health',
      alarmRule: 'ALARM("api-4xx-rate") OR ALARM("api-5xx-rate")',
    },
  ],

  // Metric filters for log-based alerting
  metricFilters: [
    {
      name: 'error-filter',
      logGroupName: '/aws/lambda/my-function',
      filterPattern: '[ERROR]',
      metricTransformation: {
        metricName: 'ErrorCount',
        metricNamespace: 'Custom/Application',
        metricValue: '1',
      },
    },
  ],
});
```

### 3. Dashboard Monitoring

[See complete example](./examples/dashboard-monitoring.ts)

```typescript
import { CloudWatchComponent, createMetricWidget } from './index';

const dashboardMonitoring = new CloudWatchComponent('dashboard-monitoring', {
  name: 'dashboard-monitoring',

  dashboards: [
    {
      name: 'application-overview',
      widgets: [
        // Metric widgets
        createMetricWidget(
          'API Performance',
          [
            {
              namespace: 'AWS/Lambda',
              metricName: 'Duration',
              dimensions: { FunctionName: 'api-service' },
              statistic: 'Average',
            },
          ],
          { x: 0, y: 0, width: 12, height: 6 }
        ),

        // Log insights widget
        {
          type: 'log',
          x: 0,
          y: 6,
          width: 24,
          height: 6,
          properties: {
            query:
              'SOURCE "/aws/lambda/api-service" | fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc',
            region: 'us-east-1',
            title: 'Recent Errors',
          },
        },
      ],
    },
  ],
});
```

## API Reference

### CloudWatchComponent

Main component for creating CloudWatch resources.

#### Constructor

```typescript
new CloudWatchComponent(name: string, args: CloudWatchArgs, opts?: ComponentResourceOptions)
```

#### Properties

- `logGroups: Record<string, aws.cloudwatch.LogGroup>` - Created log groups
- `metricAlarms: Record<string, aws.cloudwatch.MetricAlarm>` - Created metric alarms
- `compositeAlarms: Record<string, aws.cloudwatch.CompositeAlarm>` - Created composite alarms
- `dashboards: Record<string, aws.cloudwatch.Dashboard>` - Created dashboards
- `metricFilters: Record<string, aws.cloudwatch.LogMetricFilter>` - Created metric filters
- `snsTopic?: aws.sns.Topic` - SNS topic for notifications

#### Methods

##### `addLogGroup(name: string, config?: Partial<LogGroupConfig>): aws.cloudwatch.LogGroup`

Dynamically add a log group to the component.

```typescript
const logGroup = monitoring.addLogGroup('/aws/new-service', {
  retentionInDays: LOG_RETENTION_DAYS.ONE_WEEK,
});
```

##### `addMetricAlarm(name: string, metricName: string, namespace: string, threshold: number, comparisonOperator?: string, options?: Partial<MetricAlarmConfig>): aws.cloudwatch.MetricAlarm`

Dynamically add a metric alarm to the component.

```typescript
const alarm = monitoring.addMetricAlarm(
  'high-cpu',
  'CPUUtilization',
  'AWS/EC2',
  80,
  'GreaterThanThreshold',
  {
    dimensions: { InstanceId: 'i-1234567890abcdef0' },
    description: 'High CPU utilization',
  }
);
```

##### `getNotificationTopicArn(): pulumi.Output<string> | undefined`

Get the ARN of the SNS notification topic.

```typescript
const topicArn = monitoring.getNotificationTopicArn();
```

### Configuration Types

#### CloudWatchArgs

```typescript
interface CloudWatchArgs {
  name: string;
  logGroups?: LogGroupConfig[];
  metricAlarms?: MetricAlarmConfig[];
  compositeAlarms?: CompositeAlarmConfig[];
  dashboards?: DashboardConfig[];
  metricFilters?: MetricFilterConfig[];
  notifications?: NotificationConfig;
  defaultKmsKeyId?: pulumi.Input<string>;
  tags?: Record<string, pulumi.Input<string>>;
}
```

#### LogGroupConfig

```typescript
interface LogGroupConfig {
  name: string;
  retentionInDays?: number;
  kmsKeyId?: pulumi.Input<string>;
  skipDestroy?: boolean;
  tags?: Record<string, pulumi.Input<string>>;
}
```

#### MetricAlarmConfig

```typescript
interface MetricAlarmConfig {
  name: string;
  description?: string;
  metricName: string;
  namespace: string;
  statistic: string;
  period: number;
  evaluationPeriods: number;
  threshold: number;
  comparisonOperator: string;
  dimensions?: Record<string, pulumi.Input<string>>;
  treatMissingData?: string;
  datapointsToAlarm?: number;
  actionsEnabled?: boolean;
  tags?: Record<string, pulumi.Input<string>>;
}
```

#### DashboardConfig

```typescript
interface DashboardConfig {
  name: string;
  dashboardBody?: string;
  widgets?: DashboardWidgetConfig[];
}
```

### Constants

#### Log Retention Periods

```typescript
export const LOG_RETENTION_DAYS = {
  ONE_DAY: 1,
  ONE_WEEK: 7,
  ONE_MONTH: 30,
  THREE_MONTHS: 90,
  SIX_MONTHS: 180,
  ONE_YEAR: 365,
  NEVER_EXPIRE: 0,
} as const;
```

#### Comparison Operators

```typescript
export const COMPARISON_OPERATORS = {
  GREATER_THAN_THRESHOLD: 'GreaterThanThreshold',
  GREATER_THAN_OR_EQUAL_TO_THRESHOLD: 'GreaterThanOrEqualToThreshold',
  LESS_THAN_THRESHOLD: 'LessThanThreshold',
  LESS_THAN_OR_EQUAL_TO_THRESHOLD: 'LessThanOrEqualToThreshold',
} as const;
```

#### Metric Namespaces

```typescript
export const METRIC_NAMESPACES = {
  EC2: 'AWS/EC2',
  LAMBDA: 'AWS/Lambda',
  RDS: 'AWS/RDS',
  S3: 'AWS/S3',
  API_GATEWAY: 'AWS/ApiGateway',
  ECS: 'AWS/ECS',
  ELB: 'AWS/ELB',
  CLOUDFRONT: 'AWS/CloudFront',
} as const;
```

### Utility Functions

#### `createAlarmTemplates(config: AlarmTemplates): MetricAlarmConfig[]`

Generate standard alarms for common AWS services.

```typescript
const ec2Alarms = createAlarmTemplates({
  ec2: {
    instanceId: 'i-1234567890abcdef0',
    enableCpuAlarm: true,
    cpuThreshold: 85,
  },
});

const lambdaAlarms = createAlarmTemplates({
  lambda: {
    functionName: 'my-function',
    enableErrorRateAlarm: true,
    enableDurationAlarm: true,
    durationThreshold: 10000,
  },
});
```

#### `validateAlarmConfig(config: MetricAlarmConfig): string[]`

Validate alarm configuration and return validation errors.

```typescript
const errors = validateAlarmConfig({
  name: 'test-alarm',
  metricName: 'CPUUtilization',
  namespace: 'AWS/EC2',
  threshold: 80,
  // ... other properties
});

if (errors.length > 0) {
  console.error('Validation errors:', errors);
}
```

#### `createMetricWidget(title: string, metrics: MetricConfig[], layout: WidgetLayout): DashboardWidgetConfig`

Create a metric widget for dashboards.

```typescript
const widget = createMetricWidget(
  'API Performance',
  [
    {
      namespace: 'AWS/Lambda',
      metricName: 'Duration',
      dimensions: { FunctionName: 'api-service' },
      statistic: 'Average',
    },
  ],
  { x: 0, y: 0, width: 12, height: 6 }
);
```

## Security Considerations

### Encryption

- **Log Groups**: Encrypted at rest using AWS managed keys by default
- **SNS Topics**: Encryption enabled for all notification topics
- **Custom KMS Keys**: Support for customer-managed encryption keys

```typescript
const monitoring = new CloudWatchComponent('secure-monitoring', {
  name: 'secure-monitoring',
  defaultKmsKeyId: 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',

  logGroups: [
    {
      name: '/aws/lambda/sensitive-function',
      kmsKeyId: 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
    },
  ],
});
```

### Access Control

- **IAM Roles**: Least-privilege access patterns
- **Resource Policies**: Fine-grained permissions
- **Cross-Account**: Secure cross-account access support

### Data Retention

- **Automatic Cleanup**: Configurable retention periods
- **Compliance**: Support for regulatory requirements
- **Cost Control**: Prevent log accumulation costs

## Best Practices

### 1. Log Organization

```typescript
// Use consistent naming conventions
const logGroups = [
  { name: '/aws/lambda/api-service' }, // Function logs
  { name: '/aws/ecs/web-service' }, // Container logs
  { name: '/aws/apigateway/public-api' }, // API Gateway logs
];
```

### 2. Alarm Configuration

```typescript
// Use appropriate evaluation periods and thresholds
const alarms = [
  {
    name: 'critical-errors',
    threshold: 1, // Low threshold for critical errors
    evaluationPeriods: 1, // Immediate alert
    datapointsToAlarm: 1, // Alert on first occurrence
  },
  {
    name: 'high-latency',
    threshold: 2000, // 2 second threshold
    evaluationPeriods: 3, // 3 consecutive periods
    datapointsToAlarm: 2, // 2 out of 3 periods
  },
];
```

### 3. Dashboard Design

```typescript
// Organize dashboards by audience and purpose
const dashboards = [
  {
    name: 'operational-overview', // For operations team
    // ... widgets for system health
  },
  {
    name: 'business-metrics', // For business stakeholders
    // ... widgets for KPIs
  },
  {
    name: 'security-monitoring', // For security team
    // ... widgets for security events
  },
];
```

### 4. Cost Optimization

```typescript
// Use appropriate retention periods
const costOptimizedLogGroups = [
  {
    name: '/aws/lambda/dev-function',
    retentionInDays: LOG_RETENTION_DAYS.ONE_WEEK, // Short retention for dev
  },
  {
    name: '/aws/lambda/prod-function',
    retentionInDays: LOG_RETENTION_DAYS.SIX_MONTHS, // Longer for production
  },
];
```

### 5. Monitoring Strategy

```typescript
// Layer monitoring approaches
const monitoring = new CloudWatchComponent('layered-monitoring', {
  name: 'layered-monitoring',

  // Infrastructure metrics
  metricAlarms: infrastructureAlarms,

  // Application metrics
  metricFilters: applicationMetricFilters,

  // Business metrics
  // Custom metrics published by application
});
```

## Troubleshooting

### Common Issues

#### 1. Log Group Creation Fails

**Problem**: Log group already exists
**Solution**: Use `skipDestroy: true` or import existing log group

```typescript
const logGroup = {
  name: '/aws/lambda/existing-function',
  skipDestroy: true, // Don't delete on stack destruction
};
```

#### 2. Alarm Not Triggering

**Problem**: Alarm doesn't trigger when expected
**Solution**: Check metric availability and dimensions

```typescript
// Verify metric exists with correct dimensions
const alarm = {
  name: 'function-errors',
  metricName: 'Errors',
  namespace: 'AWS/Lambda',
  dimensions: {
    FunctionName: 'exact-function-name', // Must match exactly
  },
};
```

#### 3. Dashboard Widget Empty

**Problem**: Dashboard widget shows no data
**Solution**: Verify metric names and time range

```typescript
// Check metric configuration
const widget = createMetricWidget(
  'Title',
  [
    {
      namespace: 'AWS/Lambda',
      metricName: 'Invocations', // Verify metric exists
      statistic: 'Sum', // Use appropriate statistic
    },
  ],
  layout
);
```

#### 4. High CloudWatch Costs

**Problem**: Unexpected CloudWatch charges
**Solution**: Optimize retention and alarm frequency

```typescript
// Reduce retention for non-critical logs
const optimized = {
  name: '/aws/lambda/temp-function',
  retentionInDays: LOG_RETENTION_DAYS.THREE_DAYS, // Minimal retention
};

// Use longer periods for non-critical alarms
const alarm = {
  period: 900, // 15 minutes instead of 5 minutes
  evaluationPeriods: 2,
};
```

### Debugging Tips

1. **Enable CloudWatch Logs Insights**: Query logs for detailed analysis
2. **Use Composite Alarms**: Reduce alarm noise with logical combinations
3. **Monitor CloudWatch Metrics**: Track CloudWatch service usage
4. **Test Alarms**: Use alarm testing features to verify configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run `make test` to verify all tests pass
6. Submit a pull request

### Development Setup

```bash
# Install dependencies
npm install

# Run tests
make test

# Run linter
make lint

# Format code
npm run format
```

## License

MIT License - see [LICENSE](../../LICENSE) for details.

## Support

- 📖 [Documentation](https://your-docs-site.com/cloudwatch)
- 🐛 [Issue Tracker](https://github.com/your-org/repo/issues)
- 💬 [Discussions](https://github.com/your-org/repo/discussions)
- 📧 [Email Support](mailto:support@your-org.com)
