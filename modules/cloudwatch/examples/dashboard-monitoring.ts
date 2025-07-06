/**
 * CloudWatch Dashboard Example
 *
 * Demonstrates creating comprehensive monitoring dashboards with:
 * - Multiple widget types (metrics, logs, text)
 * - Different visualization options
 * - Organized layouts for different services
 * - Custom metrics and business KPIs
 */

import {
  CloudWatchComponent,
  createMetricWidget,
  createLogWidget,
  generateDashboardJson,
  LOG_RETENTION_DAYS,
  METRIC_NAMESPACES,
  COMMON_METRICS,
} from '../index';

// Create monitoring setup with comprehensive dashboards
const dashboardMonitoring = new CloudWatchComponent('dashboard-monitoring', {
  name: 'dashboard-monitoring',

  // Create log groups for dashboard log widgets
  logGroups: [
    {
      name: '/aws/lambda/api-service',
      retentionInDays: LOG_RETENTION_DAYS.ONE_MONTH,
    },
    {
      name: '/aws/lambda/worker-service',
      retentionInDays: LOG_RETENTION_DAYS.TWO_WEEKS,
    },
    {
      name: '/aws/ecs/web-application',
      retentionInDays: LOG_RETENTION_DAYS.THREE_MONTHS,
    },
  ],

  // Create multiple dashboards for different purposes
  dashboards: [
    {
      name: 'application-overview',
      widgets: [
        // Title section
        {
          type: 'text',
          x: 0,
          y: 0,
          width: 24,
          height: 1,
          properties: {
            markdown:
              '# Application Overview Dashboard\n\nReal-time monitoring of core application services',
          },
        },

        // Lambda metrics row
        createMetricWidget(
          'API Service - Invocations & Errors',
          [
            {
              namespace: METRIC_NAMESPACES.LAMBDA,
              metricName: COMMON_METRICS.LAMBDA.INVOCATIONS,
              dimensions: { FunctionName: 'api-service' },
              statistic: 'Sum',
            },
            {
              namespace: METRIC_NAMESPACES.LAMBDA,
              metricName: COMMON_METRICS.LAMBDA.ERRORS,
              dimensions: { FunctionName: 'api-service' },
              statistic: 'Sum',
            },
          ],
          { x: 0, y: 1, width: 12, height: 6 }
        ),

        createMetricWidget(
          'API Service - Duration & Throttles',
          [
            {
              namespace: METRIC_NAMESPACES.LAMBDA,
              metricName: COMMON_METRICS.LAMBDA.DURATION,
              dimensions: { FunctionName: 'api-service' },
              statistic: 'Average',
            },
            {
              namespace: METRIC_NAMESPACES.LAMBDA,
              metricName: COMMON_METRICS.LAMBDA.THROTTLES,
              dimensions: { FunctionName: 'api-service' },
              statistic: 'Sum',
            },
          ],
          { x: 12, y: 1, width: 12, height: 6 }
        ),

        // Worker service metrics
        createMetricWidget(
          'Worker Service Performance',
          [
            {
              namespace: METRIC_NAMESPACES.LAMBDA,
              metricName: COMMON_METRICS.LAMBDA.INVOCATIONS,
              dimensions: { FunctionName: 'worker-service' },
              statistic: 'Sum',
            },
            {
              namespace: METRIC_NAMESPACES.LAMBDA,
              metricName: COMMON_METRICS.LAMBDA.DURATION,
              dimensions: { FunctionName: 'worker-service' },
              statistic: 'Average',
            },
          ],
          { x: 0, y: 7, width: 12, height: 6 }
        ),

        // Custom business metrics
        createMetricWidget(
          'Business Metrics',
          [
            {
              namespace: 'Custom/Business',
              metricName: 'OrdersProcessed',
              statistic: 'Sum',
            },
            {
              namespace: 'Custom/Business',
              metricName: 'Revenue',
              statistic: 'Sum',
            },
            {
              namespace: 'Custom/Business',
              metricName: 'ActiveUsers',
              statistic: 'Average',
            },
          ],
          { x: 12, y: 7, width: 12, height: 6 }
        ),

        // Log insights widget for errors
        createLogWidget(
          'Recent API Errors',
          ['/aws/lambda/api-service'],
          `fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 20`,
          { x: 0, y: 13, width: 24, height: 6 }
        ),
      ],
    },

    {
      name: 'infrastructure-health',
      widgets: [
        // Infrastructure title
        {
          type: 'text',
          x: 0,
          y: 0,
          width: 24,
          height: 1,
          properties: {
            markdown:
              '# Infrastructure Health Dashboard\n\nMonitoring AWS resources and system health',
          },
        },

        // EC2 metrics
        createMetricWidget(
          'EC2 CPU & Memory',
          [
            {
              namespace: METRIC_NAMESPACES.EC2,
              metricName: COMMON_METRICS.EC2.CPU_UTILIZATION,
              dimensions: { InstanceId: 'i-1234567890abcdef0' },
              statistic: 'Average',
            },
            {
              namespace: 'System/Linux',
              metricName: 'MemoryUtilization',
              dimensions: { InstanceId: 'i-1234567890abcdef0' },
              statistic: 'Average',
            },
          ],
          { x: 0, y: 1, width: 8, height: 6 }
        ),

        // RDS metrics
        createMetricWidget(
          'Database Performance',
          [
            {
              namespace: METRIC_NAMESPACES.RDS,
              metricName: COMMON_METRICS.RDS.CPU_UTILIZATION,
              dimensions: { DBInstanceIdentifier: 'production-db' },
              statistic: 'Average',
            },
            {
              namespace: METRIC_NAMESPACES.RDS,
              metricName: COMMON_METRICS.RDS.DATABASE_CONNECTIONS,
              dimensions: { DBInstanceIdentifier: 'production-db' },
              statistic: 'Average',
            },
          ],
          { x: 8, y: 1, width: 8, height: 6 }
        ),

        // API Gateway metrics
        createMetricWidget(
          'API Gateway Health',
          [
            {
              namespace: METRIC_NAMESPACES.API_GATEWAY,
              metricName: 'Count',
              dimensions: { ApiName: 'public-api' },
              statistic: 'Sum',
            },
            {
              namespace: METRIC_NAMESPACES.API_GATEWAY,
              metricName: 'Latency',
              dimensions: { ApiName: 'public-api' },
              statistic: 'Average',
            },
          ],
          { x: 16, y: 1, width: 8, height: 6 }
        ),

        // Network metrics
        createMetricWidget(
          'Network Traffic',
          [
            {
              namespace: METRIC_NAMESPACES.EC2,
              metricName: COMMON_METRICS.EC2.NETWORK_IN,
              dimensions: { InstanceId: 'i-1234567890abcdef0' },
              statistic: 'Average',
            },
            {
              namespace: METRIC_NAMESPACES.EC2,
              metricName: COMMON_METRICS.EC2.NETWORK_OUT,
              dimensions: { InstanceId: 'i-1234567890abcdef0' },
              statistic: 'Average',
            },
          ],
          { x: 0, y: 7, width: 12, height: 6 }
        ),

        // Storage metrics
        createMetricWidget(
          'Storage Metrics',
          [
            {
              namespace: METRIC_NAMESPACES.RDS,
              metricName: COMMON_METRICS.RDS.FREE_STORAGE_SPACE,
              dimensions: { DBInstanceIdentifier: 'production-db' },
              statistic: 'Average',
            },
            {
              namespace: METRIC_NAMESPACES.S3,
              metricName: 'BucketSizeBytes',
              dimensions: { BucketName: 'production-bucket', StorageType: 'StandardStorage' },
              statistic: 'Average',
            },
          ],
          { x: 12, y: 7, width: 12, height: 6 }
        ),

        // System logs
        createLogWidget(
          'System Warnings & Errors',
          ['/aws/ecs/web-application'],
          `fields @timestamp, @message
| filter @message like /WARN|ERROR/
| sort @timestamp desc
| limit 15`,
          { x: 0, y: 13, width: 24, height: 6 }
        ),
      ],
    },

    {
      name: 'security-monitoring',
      widgets: [
        // Security title
        {
          type: 'text',
          x: 0,
          y: 0,
          width: 24,
          height: 1,
          properties: {
            markdown:
              '# Security Monitoring Dashboard\n\nTracking security events and authentication metrics',
          },
        },

        // Authentication metrics
        createMetricWidget(
          'Authentication Events',
          [
            {
              namespace: 'Custom/Security',
              metricName: 'LoginAttempts',
              statistic: 'Sum',
            },
            {
              namespace: 'Custom/Security',
              metricName: 'FailedLogins',
              statistic: 'Sum',
            },
            {
              namespace: 'Custom/Security',
              metricName: 'SecurityViolations',
              statistic: 'Sum',
            },
          ],
          { x: 0, y: 1, width: 12, height: 6 }
        ),

        // API security metrics
        createMetricWidget(
          'API Security',
          [
            {
              namespace: METRIC_NAMESPACES.API_GATEWAY,
              metricName: '4XXError',
              dimensions: { ApiName: 'public-api' },
              statistic: 'Sum',
            },
            {
              namespace: METRIC_NAMESPACES.API_GATEWAY,
              metricName: '5XXError',
              dimensions: { ApiName: 'public-api' },
              statistic: 'Sum',
            },
          ],
          { x: 12, y: 1, width: 12, height: 6 }
        ),

        // Security logs
        createLogWidget(
          'Security Events',
          ['/aws/lambda/api-service'],
          `fields @timestamp, @message
| filter @message like /UNAUTHORIZED|FORBIDDEN|SECURITY/
| sort @timestamp desc
| limit 20`,
          { x: 0, y: 7, width: 24, height: 6 }
        ),
      ],
    },
  ],

  tags: {
    Environment: 'production',
    Purpose: 'dashboard-monitoring',
    Team: 'devops',
  },
});

// Create a custom dashboard using raw JSON
const customDashboard = new CloudWatchComponent('custom-dashboard', {
  name: 'custom-dashboard',

  dashboards: [
    {
      name: 'executive-summary',
      dashboardBody: generateDashboardJson([
        {
          type: 'text',
          x: 0,
          y: 0,
          width: 24,
          height: 2,
          properties: {
            markdown: `# Executive Summary Dashboard
            
**Last Updated:** $(aws:now)

Key Performance Indicators for business stakeholders`,
          },
        },

        // High-level KPIs
        {
          type: 'number',
          x: 0,
          y: 2,
          width: 6,
          height: 3,
          properties: {
            metrics: [['Custom/Business', 'TotalRevenue']],
            title: 'Total Revenue',
            view: 'singleValue',
            region: 'us-east-1',
            stat: 'Sum',
            period: 86400, // 24 hours
          },
        },

        {
          type: 'number',
          x: 6,
          y: 2,
          width: 6,
          height: 3,
          properties: {
            metrics: [['Custom/Business', 'ActiveUsers']],
            title: 'Active Users',
            view: 'singleValue',
            region: 'us-east-1',
            stat: 'Average',
            period: 3600, // 1 hour
          },
        },

        {
          type: 'number',
          x: 12,
          y: 2,
          width: 6,
          height: 3,
          properties: {
            metrics: [['Custom/Business', 'OrdersProcessed']],
            title: 'Orders Processed',
            view: 'singleValue',
            region: 'us-east-1',
            stat: 'Sum',
            period: 86400,
          },
        },

        {
          type: 'number',
          x: 18,
          y: 2,
          width: 6,
          height: 3,
          properties: {
            metrics: [['Custom/Performance', 'OverallHealth']],
            title: 'System Health %',
            view: 'singleValue',
            region: 'us-east-1',
            stat: 'Average',
            period: 300,
          },
        },

        // Trend charts
        createMetricWidget(
          'Revenue Trend (7 Days)',
          [
            {
              namespace: 'Custom/Business',
              metricName: 'TotalRevenue',
              statistic: 'Sum',
            },
          ],
          { x: 0, y: 5, width: 12, height: 6 }
        ),

        createMetricWidget(
          'User Activity Trend',
          [
            {
              namespace: 'Custom/Business',
              metricName: 'ActiveUsers',
              statistic: 'Average',
            },
            {
              namespace: 'Custom/Business',
              metricName: 'NewUsers',
              statistic: 'Sum',
            },
          ],
          { x: 12, y: 5, width: 12, height: 6 }
        ),
      ]),
    },
  ],

  tags: {
    Environment: 'production',
    Audience: 'executives',
    UpdateFrequency: 'real-time',
  },
});

// Export monitoring components
export { dashboardMonitoring, customDashboard };
