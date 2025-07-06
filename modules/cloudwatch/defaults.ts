/**
 * CloudWatch Module Secure Defaults
 *
 * Security-first configuration defaults for AWS CloudWatch
 */

import * as pulumi from '@pulumi/pulumi';
import {
  LOG_RETENTION_DAYS,
  COMPARISON_OPERATORS,
  STATISTICS,
  METRIC_NAMESPACES,
  COMMON_METRICS,
  type LogGroupConfig,
  type MetricAlarmConfig,
  type NotificationConfig,
  type DashboardWidgetConfig,
  type MetricFilterConfig,
  type MetricTransformationConfig,
  type AlarmTemplates,
} from './types';

/**
 * Default CloudWatch configuration with security best practices
 */
export const CLOUDWATCH_DEFAULTS = {
  /** Default log retention period (90 days for security/compliance) */
  defaultRetentionDays: LOG_RETENTION_DAYS.THREE_MONTHS,

  /** Enable encryption by default */
  enableEncryption: true,

  /** Enable detailed monitoring by default */
  enableDetailedMonitoring: true,

  /** Default alarm evaluation periods */
  defaultEvaluationPeriods: 2,

  /** Default alarm period (5 minutes) */
  defaultPeriod: 300,

  /** Default alarm statistic */
  defaultStatistic: STATISTICS.AVERAGE,

  /** Treat missing data as not breaching by default */
  defaultTreatMissingData: 'notBreaching',

  /** Enable alarm actions by default */
  defaultActionsEnabled: true,

  /** Default datapoints to alarm (same as evaluation periods for immediate alerting) */
  defaultDatapointsToAlarm: 2,

  /** Default SNS topic encryption */
  enableSnsEncryption: true,

  /** Skip destroy protection for development environments */
  defaultSkipDestroy: false,

  /** Default tags for compliance and security */
  defaultTags: {
    Component: 'CloudWatch',
    ManagedBy: 'SecureByDesign',
    SecurityLevel: 'high',
    Compliance: 'required',
    Monitoring: 'enabled',
  },
} as const;

/**
 * Create a secure log group configuration
 */
export function createLogGroupConfig(
  name: string,
  options: Partial<LogGroupConfig> = {}
): LogGroupConfig {
  const config: LogGroupConfig = {
    name,
    retentionInDays: options.retentionInDays ?? CLOUDWATCH_DEFAULTS.defaultRetentionDays,
    skipDestroy: options.skipDestroy ?? CLOUDWATCH_DEFAULTS.defaultSkipDestroy,
    tags: {
      ...CLOUDWATCH_DEFAULTS.defaultTags,
      ...options.tags,
    },
  };

  if (options.kmsKeyId !== undefined) {
    config.kmsKeyId = options.kmsKeyId;
  }

  return config;
}

/**
 * Create a secure metric alarm configuration
 */
export function createMetricAlarmConfig(
  name: string,
  metricName: string,
  namespace: string,
  threshold: number,
  comparisonOperator: string = COMPARISON_OPERATORS.GREATER_THAN_THRESHOLD,
  options: Partial<MetricAlarmConfig> = {}
): MetricAlarmConfig {
  const config: MetricAlarmConfig = {
    name,
    description: options.description ?? `Alarm for ${metricName} in ${namespace}`,
    metricName,
    namespace,
    threshold,
    comparisonOperator,
    statistic: options.statistic ?? CLOUDWATCH_DEFAULTS.defaultStatistic,
    period: options.period ?? CLOUDWATCH_DEFAULTS.defaultPeriod,
    evaluationPeriods: options.evaluationPeriods ?? CLOUDWATCH_DEFAULTS.defaultEvaluationPeriods,
    datapointsToAlarm: options.datapointsToAlarm ?? CLOUDWATCH_DEFAULTS.defaultDatapointsToAlarm,
    treatMissingData: options.treatMissingData ?? CLOUDWATCH_DEFAULTS.defaultTreatMissingData,
    actionsEnabled: options.actionsEnabled ?? CLOUDWATCH_DEFAULTS.defaultActionsEnabled,
    tags: {
      ...CLOUDWATCH_DEFAULTS.defaultTags,
      ...options.tags,
    },
  };

  // Only set optional properties if they are defined
  if (options.dimensions !== undefined) {
    config.dimensions = options.dimensions;
  }
  if (options.alarmActions !== undefined) {
    config.alarmActions = options.alarmActions;
  }
  if (options.okActions !== undefined) {
    config.okActions = options.okActions;
  }
  if (options.insufficientDataActions !== undefined) {
    config.insufficientDataActions = options.insufficientDataActions;
  }
  if (options.extendedStatistic !== undefined) {
    config.extendedStatistic = options.extendedStatistic;
  }
  if (options.evaluateLowSampleCountPercentile !== undefined) {
    config.evaluateLowSampleCountPercentile = options.evaluateLowSampleCountPercentile;
  }

  return config;
}

/**
 * Create secure SNS notification configuration
 */
export function createNotificationConfig(
  options: Partial<NotificationConfig> = {}
): NotificationConfig {
  const config: NotificationConfig = {
    enableEncryption: options.enableEncryption ?? CLOUDWATCH_DEFAULTS.enableSnsEncryption,
  };

  // Only set optional properties if they are defined
  if (options.topicName !== undefined) {
    config.topicName = options.topicName;
  }
  if (options.topicArn !== undefined) {
    config.topicArn = options.topicArn;
  }
  if (options.emailEndpoints !== undefined) {
    config.emailEndpoints = options.emailEndpoints;
  }
  if (options.smsEndpoints !== undefined) {
    config.smsEndpoints = options.smsEndpoints;
  }
  if (options.httpsEndpoints !== undefined) {
    config.httpsEndpoints = options.httpsEndpoints;
  }
  if (options.lambdaEndpoints !== undefined) {
    config.lambdaEndpoints = options.lambdaEndpoints;
  }
  if (options.sqsEndpoints !== undefined) {
    config.sqsEndpoints = options.sqsEndpoints;
  }
  if (options.kmsKeyId !== undefined) {
    config.kmsKeyId = options.kmsKeyId;
  }

  return config;
}

/**
 * Create a dashboard widget for metrics
 */
export function createMetricWidget(
  title: string,
  metrics: Array<{
    namespace: string;
    metricName: string;
    dimensions?: Record<string, string>;
    statistic?: string;
  }>,
  position: { x: number; y: number; width?: number; height?: number } = { x: 0, y: 0 }
): DashboardWidgetConfig {
  const formattedMetrics = metrics.map(metric => [
    metric.namespace,
    metric.metricName,
    ...(metric.dimensions ? Object.entries(metric.dimensions).flat() : []),
    { stat: metric.statistic ?? STATISTICS.AVERAGE },
  ]);

  return {
    type: 'metric',
    properties: {
      metrics: formattedMetrics,
      view: 'timeSeries',
      stacked: false,
      region: new pulumi.Config('aws').get('region') ?? 'us-east-1',
      title,
      period: 300,
      yAxis: {
        left: {
          min: 0,
        },
      },
    },
    x: position.x,
    y: position.y,
    width: position.width ?? 12,
    height: position.height ?? 6,
  };
}

/**
 * Create a log widget for dashboards
 */
export function createLogWidget(
  title: string,
  logGroups: string[],
  query: string,
  position: { x: number; y: number; width?: number; height?: number } = { x: 0, y: 0 }
): DashboardWidgetConfig {
  return {
    type: 'log',
    properties: {
      query: `SOURCE '${logGroups.join("', '")}'\n${query}`,
      region: new pulumi.Config('aws').get('region') ?? 'us-east-1',
      title,
    },
    x: position.x,
    y: position.y,
    width: position.width ?? 12,
    height: position.height ?? 6,
  };
}

/**
 * Create a metric filter for log analysis
 */
export function createMetricFilter(
  name: string,
  logGroupName: pulumi.Input<string>,
  filterPattern: string,
  metricName: string,
  metricNamespace: string,
  metricValue: string = '1',
  options: Partial<MetricFilterConfig> = {}
): MetricFilterConfig {
  const transformation: MetricTransformationConfig = {
    metricName,
    metricNamespace,
    metricValue,
    defaultValue: options.metricTransformation?.defaultValue ?? 0,
  };

  if (options.metricTransformation?.unit !== undefined) {
    transformation.unit = options.metricTransformation.unit;
  }

  return {
    name,
    logGroupName,
    filterPattern,
    metricTransformation: transformation,
  };
}

/**
 * Pre-configured alarm templates for common AWS services
 */
export function createAlarmTemplates(templates: AlarmTemplates): MetricAlarmConfig[] {
  const alarms: MetricAlarmConfig[] = [];

  // EC2 Instance Alarms
  if (templates.ec2) {
    const ec2 = templates.ec2;

    if (ec2.enableCpuAlarm ?? true) {
      alarms.push(
        createMetricAlarmConfig(
          `${ec2.instanceId}-high-cpu`,
          COMMON_METRICS.EC2.CPU_UTILIZATION,
          METRIC_NAMESPACES.EC2,
          ec2.cpuThreshold ?? 80,
          COMPARISON_OPERATORS.GREATER_THAN_THRESHOLD,
          {
            description: `High CPU utilization for EC2 instance ${ec2.instanceId}`,
            dimensions: { InstanceId: ec2.instanceId },
            period: 300,
            evaluationPeriods: 3,
          }
        )
      );
    }

    if (ec2.enableDiskSpaceAlarm) {
      alarms.push(
        createMetricAlarmConfig(
          `${ec2.instanceId}-low-disk-space`,
          'DiskSpaceUtilization',
          'System/Linux',
          ec2.diskSpaceThreshold ?? 90,
          COMPARISON_OPERATORS.GREATER_THAN_THRESHOLD,
          {
            description: `Low disk space for EC2 instance ${ec2.instanceId}`,
            dimensions: { InstanceId: ec2.instanceId },
            period: 300,
            evaluationPeriods: 2,
          }
        )
      );
    }

    if (ec2.enableMemoryAlarm) {
      alarms.push(
        createMetricAlarmConfig(
          `${ec2.instanceId}-high-memory`,
          'MemoryUtilization',
          'System/Linux',
          ec2.memoryThreshold ?? 90,
          COMPARISON_OPERATORS.GREATER_THAN_THRESHOLD,
          {
            description: `High memory utilization for EC2 instance ${ec2.instanceId}`,
            dimensions: { InstanceId: ec2.instanceId },
            period: 300,
            evaluationPeriods: 3,
          }
        )
      );
    }
  }

  // RDS Alarms
  if (templates.rds) {
    const rds = templates.rds;

    if (rds.enableCpuAlarm ?? true) {
      alarms.push(
        createMetricAlarmConfig(
          `${rds.dbInstanceId}-high-cpu`,
          COMMON_METRICS.RDS.CPU_UTILIZATION,
          METRIC_NAMESPACES.RDS,
          rds.cpuThreshold ?? 80,
          COMPARISON_OPERATORS.GREATER_THAN_THRESHOLD,
          {
            description: `High CPU utilization for RDS instance ${rds.dbInstanceId}`,
            dimensions: { DBInstanceIdentifier: rds.dbInstanceId },
            period: 300,
            evaluationPeriods: 3,
          }
        )
      );
    }

    if (rds.enableConnectionAlarm) {
      alarms.push(
        createMetricAlarmConfig(
          `${rds.dbInstanceId}-high-connections`,
          COMMON_METRICS.RDS.DATABASE_CONNECTIONS,
          METRIC_NAMESPACES.RDS,
          rds.connectionThreshold ?? 80,
          COMPARISON_OPERATORS.GREATER_THAN_THRESHOLD,
          {
            description: `High database connections for RDS instance ${rds.dbInstanceId}`,
            dimensions: { DBInstanceIdentifier: rds.dbInstanceId },
            period: 300,
            evaluationPeriods: 2,
          }
        )
      );
    }

    if (rds.enableFreeStorageAlarm) {
      alarms.push(
        createMetricAlarmConfig(
          `${rds.dbInstanceId}-low-free-storage`,
          COMMON_METRICS.RDS.FREE_STORAGE_SPACE,
          METRIC_NAMESPACES.RDS,
          rds.freeStorageThreshold ?? 2000000000, // 2GB in bytes
          COMPARISON_OPERATORS.LESS_THAN_THRESHOLD,
          {
            description: `Low free storage space for RDS instance ${rds.dbInstanceId}`,
            dimensions: { DBInstanceIdentifier: rds.dbInstanceId },
            period: 300,
            evaluationPeriods: 2,
          }
        )
      );
    }
  }

  // Lambda Function Alarms
  if (templates.lambda) {
    const lambda = templates.lambda;

    if (lambda.enableErrorRateAlarm ?? true) {
      alarms.push(
        createMetricAlarmConfig(
          `${lambda.functionName}-high-error-rate`,
          COMMON_METRICS.LAMBDA.ERRORS,
          METRIC_NAMESPACES.LAMBDA,
          lambda.errorRateThreshold ?? 5,
          COMPARISON_OPERATORS.GREATER_THAN_THRESHOLD,
          {
            description: `High error rate for Lambda function ${lambda.functionName}`,
            dimensions: { FunctionName: lambda.functionName },
            period: 300,
            evaluationPeriods: 2,
            statistic: STATISTICS.SUM,
          }
        )
      );
    }

    if (lambda.enableDurationAlarm) {
      alarms.push(
        createMetricAlarmConfig(
          `${lambda.functionName}-high-duration`,
          COMMON_METRICS.LAMBDA.DURATION,
          METRIC_NAMESPACES.LAMBDA,
          lambda.durationThreshold ?? 30000, // 30 seconds
          COMPARISON_OPERATORS.GREATER_THAN_THRESHOLD,
          {
            description: `High duration for Lambda function ${lambda.functionName}`,
            dimensions: { FunctionName: lambda.functionName },
            period: 300,
            evaluationPeriods: 3,
            statistic: STATISTICS.AVERAGE,
          }
        )
      );
    }

    if (lambda.enableThrottleAlarm) {
      alarms.push(
        createMetricAlarmConfig(
          `${lambda.functionName}-throttles`,
          COMMON_METRICS.LAMBDA.THROTTLES,
          METRIC_NAMESPACES.LAMBDA,
          lambda.throttleThreshold ?? 1,
          COMPARISON_OPERATORS.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
          {
            description: `Throttles detected for Lambda function ${lambda.functionName}`,
            dimensions: { FunctionName: lambda.functionName },
            period: 300,
            evaluationPeriods: 1,
            statistic: STATISTICS.SUM,
          }
        )
      );
    }
  }

  // Application Load Balancer Alarms
  if (templates.alb) {
    const alb = templates.alb;

    if (alb.enableResponseTimeAlarm) {
      alarms.push(
        createMetricAlarmConfig(
          `${alb.loadBalancerName}-high-response-time`,
          COMMON_METRICS.ALB.TARGET_RESPONSE_TIME,
          METRIC_NAMESPACES.ALB,
          alb.responseTimeThreshold ?? 1, // 1 second
          COMPARISON_OPERATORS.GREATER_THAN_THRESHOLD,
          {
            description: `High response time for ALB ${alb.loadBalancerName}`,
            dimensions: { LoadBalancer: alb.loadBalancerName },
            period: 300,
            evaluationPeriods: 3,
            statistic: STATISTICS.AVERAGE,
          }
        )
      );
    }

    if (alb.enable4xxErrorAlarm) {
      alarms.push(
        createMetricAlarmConfig(
          `${alb.loadBalancerName}-high-4xx-errors`,
          COMMON_METRICS.ALB.HTTP_CODE_TARGET_4XX,
          METRIC_NAMESPACES.ALB,
          alb.errorThreshold4xx ?? 10,
          COMPARISON_OPERATORS.GREATER_THAN_THRESHOLD,
          {
            description: `High 4xx error rate for ALB ${alb.loadBalancerName}`,
            dimensions: { LoadBalancer: alb.loadBalancerName },
            period: 300,
            evaluationPeriods: 2,
            statistic: STATISTICS.SUM,
          }
        )
      );
    }

    if (alb.enable5xxErrorAlarm) {
      alarms.push(
        createMetricAlarmConfig(
          `${alb.loadBalancerName}-high-5xx-errors`,
          COMMON_METRICS.ALB.HTTP_CODE_TARGET_5XX,
          METRIC_NAMESPACES.ALB,
          alb.errorThreshold5xx ?? 5,
          COMPARISON_OPERATORS.GREATER_THAN_THRESHOLD,
          {
            description: `High 5xx error rate for ALB ${alb.loadBalancerName}`,
            dimensions: { LoadBalancer: alb.loadBalancerName },
            period: 300,
            evaluationPeriods: 2,
            statistic: STATISTICS.SUM,
          }
        )
      );
    }
  }

  return alarms;
}

/**
 * Common log patterns for metric filters
 */
export const LOG_PATTERNS = {
  /** Error patterns */
  ERROR: '[ERROR]',
  WARN: '[WARN]',
  EXCEPTION: 'Exception',

  /** HTTP patterns */
  HTTP_4XX: '[status_code="4*"]',
  HTTP_5XX: '[status_code="5*"]',

  /** Application patterns */
  TIMEOUT: 'timeout',
  CONNECTION_ERROR: 'connection error',
  DATABASE_ERROR: 'database error',

  /** Security patterns */
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  LOGIN_FAILED: 'login failed',

  /** Performance patterns */
  SLOW_QUERY: '[duration > 1000]',
  HIGH_MEMORY: 'high memory usage',

  /** Custom JSON patterns */
  JSON_ERROR: '{ $.level = "ERROR" }',
  JSON_LATENCY_HIGH: '{ $.latency > 1000 }',
} as const;

/**
 * Validate alarm configuration
 */
export function validateAlarmConfig(config: MetricAlarmConfig): string[] {
  const errors: string[] = [];

  if (!config.name) {
    errors.push('Alarm name is required');
  }

  if (!config.metricName) {
    errors.push('Metric name is required');
  }

  if (!config.namespace) {
    errors.push('Namespace is required');
  }

  if (config.threshold === undefined || config.threshold === null) {
    errors.push('Threshold is required');
  }

  if (!config.comparisonOperator) {
    errors.push('Comparison operator is required');
  }

  if (!config.statistic && !config.extendedStatistic) {
    errors.push('Either statistic or extended statistic is required');
  }

  if (config.period < 60) {
    errors.push('Period must be at least 60 seconds');
  }

  if (config.evaluationPeriods < 1) {
    errors.push('Evaluation periods must be at least 1');
  }

  if (config.datapointsToAlarm && config.datapointsToAlarm > config.evaluationPeriods) {
    errors.push('Datapoints to alarm cannot exceed evaluation periods');
  }

  return errors;
}

/**
 * Generate dashboard JSON from widgets
 */
export function generateDashboardJson(widgets: DashboardWidgetConfig[]): string {
  return JSON.stringify({
    widgets: widgets.map(widget => ({
      type: widget.type,
      x: widget.x,
      y: widget.y,
      width: widget.width,
      height: widget.height,
      properties: widget.properties,
    })),
  });
}
