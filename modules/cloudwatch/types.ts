/**
 * CloudWatch Module Type Definitions
 *
 * Comprehensive types for AWS CloudWatch monitoring and logging
 */

import * as pulumi from '@pulumi/pulumi';

/**
 * Log retention periods in days
 */
export const LOG_RETENTION_DAYS = {
  ONE_DAY: 1,
  THREE_DAYS: 3,
  FIVE_DAYS: 5,
  ONE_WEEK: 7,
  TWO_WEEKS: 14,
  ONE_MONTH: 30,
  TWO_MONTHS: 60,
  THREE_MONTHS: 90,
  FOUR_MONTHS: 120,
  FIVE_MONTHS: 150,
  SIX_MONTHS: 180,
  ONE_YEAR: 365,
  EIGHTEEN_MONTHS: 400,
  TWO_YEARS: 731,
  FIVE_YEARS: 1827,
  TEN_YEARS: 3653,
  NEVER_EXPIRE: 0,
} as const;

/**
 * Alarm comparison operators
 */
export const COMPARISON_OPERATORS = {
  GREATER_THAN_THRESHOLD: 'GreaterThanThreshold',
  GREATER_THAN_OR_EQUAL_TO_THRESHOLD: 'GreaterThanOrEqualToThreshold',
  LESS_THAN_THRESHOLD: 'LessThanThreshold',
  LESS_THAN_OR_EQUAL_TO_THRESHOLD: 'LessThanOrEqualToThreshold',
  LESS_THAN_LOWER_OR_GREATER_THAN_UPPER_THRESHOLD: 'LessThanLowerOrGreaterThanUpperThreshold',
  LESS_THAN_LOWER_THRESHOLD: 'LessThanLowerThreshold',
  GREATER_THAN_UPPER_THRESHOLD: 'GreaterThanUpperThreshold',
} as const;

/**
 * Alarm states
 */
export const ALARM_STATES = {
  OK: 'OK',
  ALARM: 'ALARM',
  INSUFFICIENT_DATA: 'INSUFFICIENT_DATA',
} as const;

/**
 * Alarm statistics
 */
export const STATISTICS = {
  SAMPLE_COUNT: 'SampleCount',
  AVERAGE: 'Average',
  SUM: 'Sum',
  MINIMUM: 'Minimum',
  MAXIMUM: 'Maximum',
} as const;

/**
 * Dashboard widget types
 */
export const WIDGET_TYPES = {
  METRIC: 'metric',
  LOG: 'log',
  TEXT: 'text',
  NUMBER: 'number',
} as const;

/**
 * Log group configuration
 */
export interface LogGroupConfig {
  /** Name of the log group */
  name: string;
  /** Retention period in days */
  retentionInDays?: number;
  /** KMS key ID for encryption */
  kmsKeyId?: pulumi.Input<string>;
  /** Skip destroy protection */
  skipDestroy?: boolean;
  /** Additional tags */
  tags?: Record<string, string>;
}

/**
 * Log stream configuration
 */
export interface LogStreamConfig {
  /** Name of the log stream */
  name: string;
  /** Associated log group name */
  logGroupName: pulumi.Input<string>;
}

/**
 * Metric alarm configuration
 */
export interface MetricAlarmConfig {
  /** Alarm name */
  name: string;
  /** Alarm description */
  description?: string;
  /** Metric name */
  metricName: string;
  /** Namespace */
  namespace: string;
  /** Statistic */
  statistic: string;
  /** Period in seconds */
  period: number;
  /** Evaluation periods */
  evaluationPeriods: number;
  /** Datapoints to alarm */
  datapointsToAlarm?: number;
  /** Threshold value */
  threshold: number;
  /** Comparison operator */
  comparisonOperator: string;
  /** Treat missing data */
  treatMissingData?: string;
  /** Evaluate low sample count percentile */
  evaluateLowSampleCountPercentile?: string;
  /** Extended statistic */
  extendedStatistic?: string;
  /** Metric dimensions */
  dimensions?: Record<string, string>;
  /** Alarm actions (SNS topic ARNs) */
  alarmActions?: pulumi.Input<string>[];
  /** OK actions */
  okActions?: pulumi.Input<string>[];
  /** Insufficient data actions */
  insufficientDataActions?: pulumi.Input<string>[];
  /** Enable actions */
  actionsEnabled?: boolean;
  /** Additional tags */
  tags?: Record<string, string>;
}

/**
 * Composite alarm configuration
 */
export interface CompositeAlarmConfig {
  /** Alarm name */
  name: string;
  /** Alarm description */
  description?: string;
  /** Alarm rule expression */
  alarmRule: string;
  /** Actions enabled */
  actionsEnabled?: boolean;
  /** Alarm actions */
  alarmActions?: pulumi.Input<string>[];
  /** OK actions */
  okActions?: pulumi.Input<string>[];
  /** Insufficient data actions */
  insufficientDataActions?: pulumi.Input<string>[];
  /** Additional tags */
  tags?: Record<string, string>;
}

/**
 * Custom metric configuration
 */
export interface CustomMetricConfig {
  /** Metric name */
  name: string;
  /** Namespace */
  namespace: string;
  /** Value */
  value: number;
  /** Unit */
  unit?: string;
  /** Dimensions */
  dimensions?: Record<string, string>;
  /** Timestamp */
  timestamp?: Date;
}

/**
 * Metric filter configuration
 */
export interface MetricFilterConfig {
  /** Filter name */
  name: string;
  /** Log group name */
  logGroupName: pulumi.Input<string>;
  /** Filter pattern */
  filterPattern: string;
  /** Metric transformation */
  metricTransformation: MetricTransformationConfig;
}

/**
 * Metric transformation configuration
 */
export interface MetricTransformationConfig {
  /** Metric name */
  metricName: string;
  /** Metric namespace */
  metricNamespace: string;
  /** Metric value */
  metricValue: string;
  /** Default value */
  defaultValue?: number;
  /** Unit */
  unit?: string;
}

/**
 * Dashboard widget configuration
 */
export interface DashboardWidgetConfig {
  /** Widget type */
  type: string;
  /** Widget properties */
  properties: any;
  /** Widget position */
  x: number;
  y: number;
  /** Widget width */
  width: number;
  /** Widget height */
  height: number;
}

/**
 * Dashboard configuration
 */
export interface DashboardConfig {
  /** Dashboard name */
  name: string;
  /** Dashboard body (JSON string or widgets) */
  dashboardBody?: string;
  /** Dashboard widgets */
  widgets?: DashboardWidgetConfig[];
}

/**
 * Log insights query configuration
 */
export interface LogInsightsQueryConfig {
  /** Query name */
  name: string;
  /** Log group names */
  logGroupNames: string[];
  /** Query string */
  queryString: string;
  /** Start time */
  startTime?: Date;
  /** End time */
  endTime?: Date;
  /** Max results */
  limit?: number;
}

/**
 * SNS notification configuration
 */
export interface NotificationConfig {
  /** Topic name */
  topicName?: string;
  /** Topic ARN (if existing) */
  topicArn?: pulumi.Input<string>;
  /** Email endpoints */
  emailEndpoints?: string[];
  /** SMS endpoints */
  smsEndpoints?: string[];
  /** HTTPS endpoints */
  httpsEndpoints?: string[];
  /** Lambda function ARNs */
  lambdaEndpoints?: pulumi.Input<string>[];
  /** SQS queue ARNs */
  sqsEndpoints?: pulumi.Input<string>[];
  /** Enable encryption */
  enableEncryption?: boolean;
  /** KMS key ID for SNS encryption */
  kmsKeyId?: pulumi.Input<string>;
}

/**
 * CloudWatch component arguments
 */
export interface CloudWatchArgs {
  /** Component name */
  name: string;
  /** Log groups to create */
  logGroups?: LogGroupConfig[];
  /** Log streams to create */
  logStreams?: LogStreamConfig[];
  /** Metric alarms to create */
  metricAlarms?: MetricAlarmConfig[];
  /** Composite alarms to create */
  compositeAlarms?: CompositeAlarmConfig[];
  /** Metric filters to create */
  metricFilters?: MetricFilterConfig[];
  /** Dashboards to create */
  dashboards?: DashboardConfig[];
  /** Notification configuration */
  notifications?: NotificationConfig;
  /** Default retention period for log groups */
  defaultRetentionDays?: number;
  /** Default KMS key for encryption */
  defaultKmsKeyId?: pulumi.Input<string>;
  /** Enable detailed monitoring */
  enableDetailedMonitoring?: boolean;
  /** Additional tags to apply to all resources */
  tags?: Record<string, string>;
}

/**
 * Pre-configured alarm templates
 */
export interface AlarmTemplates {
  /** EC2 instance alarms */
  ec2?: {
    /** Instance ID */
    instanceId: string;
    /** Enable CPU alarm */
    enableCpuAlarm?: boolean;
    /** CPU threshold percentage */
    cpuThreshold?: number;
    /** Enable disk space alarm */
    enableDiskSpaceAlarm?: boolean;
    /** Disk space threshold percentage */
    diskSpaceThreshold?: number;
    /** Enable memory alarm */
    enableMemoryAlarm?: boolean;
    /** Memory threshold percentage */
    memoryThreshold?: number;
  };
  /** RDS alarms */
  rds?: {
    /** DB instance identifier */
    dbInstanceId: string;
    /** Enable CPU alarm */
    enableCpuAlarm?: boolean;
    /** CPU threshold percentage */
    cpuThreshold?: number;
    /** Enable connection alarm */
    enableConnectionAlarm?: boolean;
    /** Connection threshold */
    connectionThreshold?: number;
    /** Enable free storage alarm */
    enableFreeStorageAlarm?: boolean;
    /** Free storage threshold in bytes */
    freeStorageThreshold?: number;
  };
  /** Lambda function alarms */
  lambda?: {
    /** Function name */
    functionName: string;
    /** Enable error rate alarm */
    enableErrorRateAlarm?: boolean;
    /** Error rate threshold percentage */
    errorRateThreshold?: number;
    /** Enable duration alarm */
    enableDurationAlarm?: boolean;
    /** Duration threshold in milliseconds */
    durationThreshold?: number;
    /** Enable throttle alarm */
    enableThrottleAlarm?: boolean;
    /** Throttle threshold */
    throttleThreshold?: number;
  };
  /** Application Load Balancer alarms */
  alb?: {
    /** Load balancer name */
    loadBalancerName: string;
    /** Enable target response time alarm */
    enableResponseTimeAlarm?: boolean;
    /** Response time threshold in seconds */
    responseTimeThreshold?: number;
    /** Enable 4xx error alarm */
    enable4xxErrorAlarm?: boolean;
    /** 4xx error threshold percentage */
    errorThreshold4xx?: number;
    /** Enable 5xx error alarm */
    enable5xxErrorAlarm?: boolean;
    /** 5xx error threshold percentage */
    errorThreshold5xx?: number;
  };
}

/**
 * Common metric namespaces
 */
export const METRIC_NAMESPACES = {
  EC2: 'AWS/EC2',
  RDS: 'AWS/RDS',
  LAMBDA: 'AWS/Lambda',
  ALB: 'AWS/ApplicationELB',
  API_GATEWAY: 'AWS/ApiGateway',
  CLOUDFRONT: 'AWS/CloudFront',
  ECS: 'AWS/ECS',
  S3: 'AWS/S3',
  DYNAMODB: 'AWS/DynamoDB',
  SNS: 'AWS/SNS',
  SQS: 'AWS/SQS',
  CUSTOM: 'Custom',
} as const;

/**
 * Common metric names by service
 */
export const COMMON_METRICS = {
  EC2: {
    CPU_UTILIZATION: 'CPUUtilization',
    DISK_READ_BYTES: 'DiskReadBytes',
    DISK_WRITE_BYTES: 'DiskWriteBytes',
    NETWORK_IN: 'NetworkIn',
    NETWORK_OUT: 'NetworkOut',
    STATUS_CHECK_FAILED: 'StatusCheckFailed',
  },
  RDS: {
    CPU_UTILIZATION: 'CPUUtilization',
    DATABASE_CONNECTIONS: 'DatabaseConnections',
    FREE_STORAGE_SPACE: 'FreeStorageSpace',
    READ_LATENCY: 'ReadLatency',
    WRITE_LATENCY: 'WriteLatency',
  },
  LAMBDA: {
    INVOCATIONS: 'Invocations',
    ERRORS: 'Errors',
    DURATION: 'Duration',
    THROTTLES: 'Throttles',
    CONCURRENT_EXECUTIONS: 'ConcurrentExecutions',
  },
  ALB: {
    TARGET_RESPONSE_TIME: 'TargetResponseTime',
    HTTP_CODE_TARGET_4XX: 'HTTPCode_Target_4XX_Count',
    HTTP_CODE_TARGET_5XX: 'HTTPCode_Target_5XX_Count',
    HEALTHY_HOST_COUNT: 'HealthyHostCount',
    UNHEALTHY_HOST_COUNT: 'UnHealthyHostCount',
  },
} as const;
