/**
 * CloudWatch Module
 *
 * AWS CloudWatch monitoring and logging with secure defaults
 */

// Export the main component
export { CloudWatchComponent } from './cloudwatch';

// Export all types
export * from './types';

// Export utility functions and defaults
export * from './defaults';

// Re-export commonly used types and constants for convenience
export type {
  CloudWatchArgs,
  LogGroupConfig,
  MetricAlarmConfig,
  NotificationConfig,
  DashboardConfig,
  AlarmTemplates,
} from './types';

export {
  LOG_RETENTION_DAYS,
  COMPARISON_OPERATORS,
  STATISTICS,
  METRIC_NAMESPACES,
  COMMON_METRICS,
} from './types';

export {
  CLOUDWATCH_DEFAULTS,
  createLogGroupConfig,
  createMetricAlarmConfig,
  createNotificationConfig,
  createAlarmTemplates,
  LOG_PATTERNS,
  validateAlarmConfig,
  generateDashboardJson,
} from './defaults';
