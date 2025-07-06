/**
 * Basic CloudWatch Monitoring Example
 *
 * Demonstrates setting up basic monitoring with:
 * - Log groups for application logging
 * - Simple metric alarms
 * - SNS notifications
 */

import {
  CloudWatchComponent,
  LOG_RETENTION_DAYS,
  COMPARISON_OPERATORS,
  STATISTICS,
  METRIC_NAMESPACES,
  COMMON_METRICS,
} from '../index';

// Create basic monitoring setup
const basicMonitoring = new CloudWatchComponent('basic-monitoring', {
  name: 'basic-monitoring',

  // Configure SNS notifications for alerts
  notifications: {
    topicName: 'basic-alerts',
    enableEncryption: true,
    emailEndpoints: ['admin@example.com'],
  },

  // Create log groups for different services
  logGroups: [
    {
      name: '/aws/lambda/my-api-function',
      retentionInDays: LOG_RETENTION_DAYS.ONE_MONTH,
    },
    {
      name: '/aws/lambda/my-worker-function',
      retentionInDays: LOG_RETENTION_DAYS.TWO_WEEKS,
    },
    {
      name: '/aws/ecs/my-web-service',
      retentionInDays: LOG_RETENTION_DAYS.THREE_MONTHS,
    },
  ],

  // Set up basic metric alarms
  metricAlarms: [
    {
      name: 'api-function-errors',
      description: 'Alert when API function has errors',
      metricName: COMMON_METRICS.LAMBDA.ERRORS,
      namespace: METRIC_NAMESPACES.LAMBDA,
      statistic: STATISTICS.SUM,
      period: 300, // 5 minutes
      evaluationPeriods: 2,
      threshold: 3,
      comparisonOperator: COMPARISON_OPERATORS.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      dimensions: {
        FunctionName: 'my-api-function',
      },
    },

    {
      name: 'api-function-duration',
      description: 'Alert when API function duration is high',
      metricName: COMMON_METRICS.LAMBDA.DURATION,
      namespace: METRIC_NAMESPACES.LAMBDA,
      statistic: STATISTICS.AVERAGE,
      period: 300,
      evaluationPeriods: 3,
      threshold: 5000, // 5 seconds
      comparisonOperator: COMPARISON_OPERATORS.GREATER_THAN_THRESHOLD,
      dimensions: {
        FunctionName: 'my-api-function',
      },
    },

    {
      name: 'ec2-high-cpu',
      description: 'Alert when EC2 instance CPU is high',
      metricName: COMMON_METRICS.EC2.CPU_UTILIZATION,
      namespace: METRIC_NAMESPACES.EC2,
      statistic: STATISTICS.AVERAGE,
      period: 300,
      evaluationPeriods: 2,
      threshold: 80, // 80%
      comparisonOperator: COMPARISON_OPERATORS.GREATER_THAN_THRESHOLD,
      dimensions: {
        InstanceId: 'i-1234567890abcdef0',
      },
    },
  ],

  // Add common tags
  tags: {
    Environment: 'production',
    Application: 'my-app',
    Team: 'backend',
  },
});

// Add additional log group dynamically
const additionalLogGroup = basicMonitoring.addLogGroup('/aws/apigateway/my-api', {
  retentionInDays: LOG_RETENTION_DAYS.SIX_MONTHS,
  tags: {
    Service: 'api-gateway',
  },
});

// Add additional alarm dynamically
const additionalAlarm = basicMonitoring.addMetricAlarm(
  'rds-cpu-high',
  COMMON_METRICS.RDS.CPU_UTILIZATION,
  METRIC_NAMESPACES.RDS,
  75, // 75%
  COMPARISON_OPERATORS.GREATER_THAN_THRESHOLD,
  {
    description: 'Alert when RDS CPU utilization is high',
    period: 300,
    evaluationPeriods: 3,
    dimensions: {
      DBInstanceIdentifier: 'my-database',
    },
    tags: {
      Service: 'database',
    },
  }
);

// Export resources for reference
export { basicMonitoring, additionalLogGroup, additionalAlarm };
