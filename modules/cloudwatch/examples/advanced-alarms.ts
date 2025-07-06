/**
 * Advanced CloudWatch Alarms Example
 *
 * Demonstrates advanced monitoring concepts:
 * - Composite alarms for complex logic
 * - Alarm templates for common services
 * - Metric filters for log-based alerting
 * - Custom metrics and thresholds
 */

import {
  CloudWatchComponent,
  createAlarmTemplates,
  createMetricFilter,
  LOG_PATTERNS,
  LOG_RETENTION_DAYS,
  COMPARISON_OPERATORS,
  STATISTICS,
  METRIC_NAMESPACES,
  COMMON_METRICS,
} from '../index';

// Create advanced monitoring setup
const advancedMonitoring = new CloudWatchComponent('advanced-monitoring', {
  name: 'advanced-monitoring',

  // Configure notifications with multiple channels
  notifications: {
    topicName: 'critical-alerts',
    enableEncryption: true,
    emailEndpoints: ['oncall@example.com', 'devops@example.com'],
    // Note: SMS and HTTPS endpoints would be added here in a real scenario
  },

  // Create log groups for different components
  logGroups: [
    {
      name: '/aws/lambda/payment-processor',
      retentionInDays: LOG_RETENTION_DAYS.ONE_YEAR, // Financial data
    },
    {
      name: '/aws/lambda/user-authentication',
      retentionInDays: LOG_RETENTION_DAYS.SIX_MONTHS, // Security logs
    },
    {
      name: '/aws/ecs/order-service',
      retentionInDays: LOG_RETENTION_DAYS.THREE_MONTHS,
    },
    {
      name: '/aws/apigateway/public-api',
      retentionInDays: LOG_RETENTION_DAYS.TWO_MONTHS,
    },
  ],

  // Advanced metric alarms with different evaluation strategies
  metricAlarms: [
    {
      name: 'payment-processor-critical-errors',
      description: 'Critical errors in payment processing',
      metricName: COMMON_METRICS.LAMBDA.ERRORS,
      namespace: METRIC_NAMESPACES.LAMBDA,
      statistic: STATISTICS.SUM,
      period: 60, // 1 minute for faster detection
      evaluationPeriods: 2,
      datapointsToAlarm: 1, // Alert on first occurrence
      threshold: 1,
      comparisonOperator: COMPARISON_OPERATORS.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: 'notBreaching',
      dimensions: {
        FunctionName: 'payment-processor',
      },
    },

    {
      name: 'api-gateway-4xx-rate',
      description: 'High 4xx error rate on API Gateway',
      metricName: '4XXError',
      namespace: METRIC_NAMESPACES.API_GATEWAY,
      statistic: STATISTICS.SUM,
      period: 300,
      evaluationPeriods: 3,
      threshold: 50, // 50 errors in 5 minutes
      comparisonOperator: COMPARISON_OPERATORS.GREATER_THAN_THRESHOLD,
      dimensions: {
        ApiName: 'public-api',
      },
    },

    {
      name: 'api-gateway-5xx-rate',
      description: 'High 5xx error rate on API Gateway',
      metricName: '5XXError',
      namespace: METRIC_NAMESPACES.API_GATEWAY,
      statistic: STATISTICS.SUM,
      period: 300,
      evaluationPeriods: 2,
      threshold: 10, // 10 errors in 5 minutes
      comparisonOperator: COMPARISON_OPERATORS.GREATER_THAN_THRESHOLD,
      dimensions: {
        ApiName: 'public-api',
      },
    },

    {
      name: 'auth-service-latency',
      description: 'High latency in authentication service',
      metricName: COMMON_METRICS.LAMBDA.DURATION,
      namespace: METRIC_NAMESPACES.LAMBDA,
      statistic: STATISTICS.AVERAGE,
      period: 300,
      evaluationPeriods: 3,
      threshold: 2000, // 2 seconds
      comparisonOperator: COMPARISON_OPERATORS.GREATER_THAN_THRESHOLD,
      dimensions: {
        FunctionName: 'user-authentication',
      },
    },

    {
      name: 'rds-connection-limit',
      description: 'RDS connection count approaching limit',
      metricName: COMMON_METRICS.RDS.DATABASE_CONNECTIONS,
      namespace: METRIC_NAMESPACES.RDS,
      statistic: STATISTICS.AVERAGE,
      period: 300,
      evaluationPeriods: 2,
      threshold: 80, // 80 connections
      comparisonOperator: COMPARISON_OPERATORS.GREATER_THAN_THRESHOLD,
      dimensions: {
        DBInstanceIdentifier: 'production-db',
      },
    },
  ],

  // Composite alarms for complex logic
  compositeAlarms: [
    {
      name: 'api-health-composite',
      description: 'Overall API health based on multiple metrics',
      alarmRule:
        'ALARM("api-gateway-4xx-rate") OR ALARM("api-gateway-5xx-rate") OR ALARM("auth-service-latency")',
      actionsEnabled: true,
    },

    {
      name: 'critical-system-failure',
      description: 'Critical system failure requiring immediate attention',
      alarmRule:
        'ALARM("payment-processor-critical-errors") OR (ALARM("api-gateway-5xx-rate") AND ALARM("rds-connection-limit"))',
      actionsEnabled: true,
    },
  ],

  // Metric filters for log-based monitoring
  metricFilters: [
    createMetricFilter(
      'payment-errors',
      '/aws/lambda/payment-processor',
      LOG_PATTERNS.ERROR,
      'PaymentErrors',
      'Custom/Application',
      '1',
      {
        metricTransformation: {
          metricName: 'PaymentErrors',
          metricNamespace: 'Custom/Application',
          metricValue: '1',
          defaultValue: 0,
        },
      }
    ),

    createMetricFilter(
      'security-violations',
      '/aws/lambda/user-authentication',
      LOG_PATTERNS.UNAUTHORIZED,
      'SecurityViolations',
      'Custom/Security',
      '1',
      {
        metricTransformation: {
          metricName: 'SecurityViolations',
          metricNamespace: 'Custom/Security',
          metricValue: '1',
          defaultValue: 0,
        },
      }
    ),

    createMetricFilter(
      'slow-queries',
      '/aws/ecs/order-service',
      LOG_PATTERNS.SLOW_QUERY,
      'SlowQueries',
      'Custom/Performance',
      '1',
      {
        metricTransformation: {
          metricName: 'SlowQueries',
          metricNamespace: 'Custom/Performance',
          metricValue: '1',
          defaultValue: 0,
        },
      }
    ),
  ],

  tags: {
    Environment: 'production',
    CriticalityLevel: 'high',
    MonitoringType: 'advanced',
    Team: 'platform',
  },
});

// Add alarms based on the custom metrics from log filters
advancedMonitoring.addMetricAlarm(
  'payment-error-rate',
  'PaymentErrors',
  'Custom/Application',
  5, // 5 errors
  COMPARISON_OPERATORS.GREATER_THAN_THRESHOLD,
  {
    description: 'High payment error rate detected from logs',
    period: 300,
    evaluationPeriods: 2,
    statistic: STATISTICS.SUM,
  }
);

advancedMonitoring.addMetricAlarm(
  'security-violations-alarm',
  'SecurityViolations',
  'Custom/Security',
  3, // 3 violations
  COMPARISON_OPERATORS.GREATER_THAN_THRESHOLD,
  {
    description: 'Security violations detected',
    period: 300,
    evaluationPeriods: 1, // Immediate alert
    statistic: STATISTICS.SUM,
    treatMissingData: 'notBreaching',
  }
);

// Create alarm templates for different service types
const ec2Alarms = createAlarmTemplates({
  ec2: {
    instanceId: 'i-prod-web-server-1',
    enableCpuAlarm: true,
    cpuThreshold: 85,
    enableMemoryAlarm: true,
    memoryThreshold: 90,
    enableDiskSpaceAlarm: true,
    diskSpaceThreshold: 85,
  },
});

const rdsAlarms = createAlarmTemplates({
  rds: {
    dbInstanceId: 'production-db',
    enableCpuAlarm: true,
    cpuThreshold: 75,
    enableConnectionAlarm: true,
    connectionThreshold: 80,
    enableFreeStorageAlarm: true,
    freeStorageThreshold: 2000000000, // 2GB
  },
});

const lambdaAlarms = createAlarmTemplates({
  lambda: {
    functionName: 'order-processor',
    enableErrorRateAlarm: true,
    errorRateThreshold: 2,
    enableDurationAlarm: true,
    durationThreshold: 15000, // 15 seconds
    enableThrottleAlarm: true,
    throttleThreshold: 1,
  },
});

// Create additional monitoring component for template-based alarms
const templateBasedMonitoring = new CloudWatchComponent('template-monitoring', {
  name: 'template-monitoring',

  // Use existing SNS topic if available
  ...(advancedMonitoring.getNotificationTopicArn() && {
    notifications: {
      topicArn: advancedMonitoring.getNotificationTopicArn()!,
    },
  }),

  // Apply all template-generated alarms
  metricAlarms: [...ec2Alarms, ...rdsAlarms, ...lambdaAlarms],

  tags: {
    Environment: 'production',
    MonitoringType: 'template-based',
    AutoGenerated: 'true',
  },
});

// Export all monitoring components
export { advancedMonitoring, templateBasedMonitoring, ec2Alarms, rdsAlarms, lambdaAlarms };
