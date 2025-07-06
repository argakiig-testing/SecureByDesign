/**
 * CloudWatch Component
 *
 * Secure-by-design AWS CloudWatch monitoring and logging component
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ComponentResource, ComponentResourceOptions } from '@pulumi/pulumi';

import {
  type CloudWatchArgs,
  type LogGroupConfig,
  type MetricAlarmConfig,
  LOG_RETENTION_DAYS,
} from './types';

import { CLOUDWATCH_DEFAULTS, validateAlarmConfig } from './defaults';

/**
 * CloudWatch Component
 *
 * Creates and manages AWS CloudWatch resources including log groups,
 * metric alarms, dashboards, and SNS notifications with secure defaults.
 */
export class CloudWatchComponent extends ComponentResource {
  /** Created log groups */
  public readonly logGroups: { [key: string]: aws.cloudwatch.LogGroup } = {};

  /** Created log streams */
  public readonly logStreams: { [key: string]: aws.cloudwatch.LogStream } = {};

  /** Created metric alarms */
  public readonly metricAlarms: { [key: string]: aws.cloudwatch.MetricAlarm } = {};

  /** Created composite alarms */
  public readonly compositeAlarms: { [key: string]: aws.cloudwatch.CompositeAlarm } = {};

  /** Created metric filters */
  public readonly metricFilters: { [key: string]: aws.cloudwatch.LogMetricFilter } = {};

  /** Created dashboards */
  public readonly dashboards: { [key: string]: aws.cloudwatch.Dashboard } = {};

  /** SNS topic for notifications */
  public snsTopic?: aws.sns.Topic;

  /** Component name */
  private readonly componentName: string;

  /** Default tags */
  private readonly defaultTags: Record<string, string>;

  constructor(name: string, args: CloudWatchArgs, opts?: ComponentResourceOptions) {
    super('securebydesign:cloudwatch:CloudWatch', name, {}, opts);

    this.componentName = name;
    this.defaultTags = {
      ...CLOUDWATCH_DEFAULTS.defaultTags,
      ...args.tags,
    };

    // Create SNS topic for notifications if configured
    if (args.notifications?.topicName) {
      this.createSnsTopic(args.notifications.topicName, args.notifications.enableEncryption);
    }

    // Create log groups
    if (args.logGroups) {
      this.createLogGroups(args.logGroups, args.defaultKmsKeyId, args.defaultRetentionDays);
    }

    // Create log streams
    if (args.logStreams) {
      this.createLogStreams(args.logStreams);
    }

    // Create metric alarms
    if (args.metricAlarms) {
      this.createMetricAlarms(args.metricAlarms);
    }

    // Create composite alarms
    if (args.compositeAlarms) {
      this.createCompositeAlarms(args.compositeAlarms);
    }

    // Create metric filters
    if (args.metricFilters) {
      this.createMetricFilters(args.metricFilters);
    }

    // Create dashboards
    if (args.dashboards) {
      this.createDashboards(args.dashboards);
    }

    // Register outputs
    this.registerOutputs({
      logGroups: this.logGroups,
      logStreams: this.logStreams,
      metricAlarms: this.metricAlarms,
      compositeAlarms: this.compositeAlarms,
      metricFilters: this.metricFilters,
      dashboards: this.dashboards,
      snsTopic: this.snsTopic,
    });
  }

  /**
   * Create SNS topic for notifications
   */
  private createSnsTopic(topicName: string, enableEncryption?: boolean): void {
    const topicArgs: aws.sns.TopicArgs = {
      name: topicName,
      displayName: `CloudWatch Alerts for ${this.componentName}`,
      tags: this.defaultTags,
    };

    if (enableEncryption) {
      topicArgs.kmsMasterKeyId = 'alias/aws/sns';
    }

    this.snsTopic = new aws.sns.Topic(`${this.componentName}-topic`, topicArgs, { parent: this });
  }

  /**
   * Create CloudWatch log groups
   */
  private createLogGroups(
    logGroups: LogGroupConfig[],
    defaultKmsKeyId?: pulumi.Input<string>,
    defaultRetentionDays?: number
  ): void {
    logGroups.forEach(logGroupConfig => {
      const logGroupArgs: aws.cloudwatch.LogGroupArgs = {
        name: logGroupConfig.name,
        skipDestroy: logGroupConfig.skipDestroy ?? CLOUDWATCH_DEFAULTS.defaultSkipDestroy,
        tags: {
          ...this.defaultTags,
          ...logGroupConfig.tags,
        },
      };

      // Set retention days if not never expire
      const retentionDays =
        logGroupConfig.retentionInDays ??
        defaultRetentionDays ??
        CLOUDWATCH_DEFAULTS.defaultRetentionDays;

      if (retentionDays !== LOG_RETENTION_DAYS.NEVER_EXPIRE) {
        logGroupArgs.retentionInDays = retentionDays;
      }

      // Set KMS key if provided
      const kmsKeyId = logGroupConfig.kmsKeyId ?? defaultKmsKeyId;
      if (kmsKeyId) {
        logGroupArgs.kmsKeyId = kmsKeyId;
      }

      this.logGroups[logGroupConfig.name] = new aws.cloudwatch.LogGroup(
        `${this.componentName}-lg-${logGroupConfig.name}`,
        logGroupArgs,
        { parent: this }
      );
    });
  }

  /**
   * Create CloudWatch log streams
   */
  private createLogStreams(logStreams: any[]): void {
    logStreams.forEach(streamConfig => {
      this.logStreams[streamConfig.name] = new aws.cloudwatch.LogStream(
        `${this.componentName}-ls-${streamConfig.name}`,
        {
          name: streamConfig.name,
          logGroupName: streamConfig.logGroupName,
        },
        { parent: this }
      );
    });
  }

  /**
   * Create CloudWatch metric alarms
   */
  private createMetricAlarms(metricAlarms: MetricAlarmConfig[]): void {
    metricAlarms.forEach(alarmConfig => {
      // Validate alarm configuration
      const validationErrors = validateAlarmConfig(alarmConfig);
      if (validationErrors.length > 0) {
        throw new Error(
          `Invalid alarm configuration for ${alarmConfig.name}: ${validationErrors.join(', ')}`
        );
      }

      // Use SNS topic ARN if available and alarm actions not specified
      const alarmActions = alarmConfig.alarmActions ?? (this.snsTopic ? [this.snsTopic.arn] : []);

      const alarmArgs: aws.cloudwatch.MetricAlarmArgs = {
        name: alarmConfig.name,
        metricName: alarmConfig.metricName,
        namespace: alarmConfig.namespace,
        statistic: alarmConfig.statistic,
        period: alarmConfig.period,
        evaluationPeriods: alarmConfig.evaluationPeriods,
        threshold: alarmConfig.threshold,
        comparisonOperator: alarmConfig.comparisonOperator,
        alarmActions,
        actionsEnabled: alarmConfig.actionsEnabled ?? CLOUDWATCH_DEFAULTS.defaultActionsEnabled,
        tags: {
          ...this.defaultTags,
          ...alarmConfig.tags,
        },
      };

      // Set optional properties if provided
      if (alarmConfig.description) {
        alarmArgs.alarmDescription = alarmConfig.description;
      }
      if (alarmConfig.datapointsToAlarm) {
        alarmArgs.datapointsToAlarm = alarmConfig.datapointsToAlarm;
      }
      if (alarmConfig.treatMissingData) {
        alarmArgs.treatMissingData = alarmConfig.treatMissingData;
      }
      if (alarmConfig.extendedStatistic) {
        alarmArgs.extendedStatistic = alarmConfig.extendedStatistic;
      }
      if (alarmConfig.evaluateLowSampleCountPercentile) {
        alarmArgs.evaluateLowSampleCountPercentiles = alarmConfig.evaluateLowSampleCountPercentile;
      }
      if (alarmConfig.dimensions) {
        alarmArgs.dimensions = alarmConfig.dimensions;
      }
      if (alarmConfig.okActions) {
        alarmArgs.okActions = alarmConfig.okActions;
      }
      if (alarmConfig.insufficientDataActions) {
        alarmArgs.insufficientDataActions = alarmConfig.insufficientDataActions;
      }

      this.metricAlarms[alarmConfig.name] = new aws.cloudwatch.MetricAlarm(
        `${this.componentName}-alarm-${alarmConfig.name}`,
        alarmArgs,
        { parent: this }
      );
    });
  }

  /**
   * Create CloudWatch composite alarms
   */
  private createCompositeAlarms(compositeAlarms: any[]): void {
    compositeAlarms.forEach(alarmConfig => {
      const alarmActions = alarmConfig.alarmActions ?? (this.snsTopic ? [this.snsTopic.arn] : []);

      this.compositeAlarms[alarmConfig.name] = new aws.cloudwatch.CompositeAlarm(
        `${this.componentName}-composite-${alarmConfig.name}`,
        {
          alarmName: alarmConfig.name,
          alarmDescription: alarmConfig.description,
          alarmRule: alarmConfig.alarmRule,
          actionsEnabled: alarmConfig.actionsEnabled ?? CLOUDWATCH_DEFAULTS.defaultActionsEnabled,
          alarmActions,
          okActions: alarmConfig.okActions,
          insufficientDataActions: alarmConfig.insufficientDataActions,
          tags: {
            ...this.defaultTags,
            ...alarmConfig.tags,
          },
        },
        { parent: this }
      );
    });
  }

  /**
   * Create CloudWatch metric filters
   */
  private createMetricFilters(metricFilters: any[]): void {
    metricFilters.forEach(filterConfig => {
      this.metricFilters[filterConfig.name] = new aws.cloudwatch.LogMetricFilter(
        `${this.componentName}-filter-${filterConfig.name}`,
        {
          name: filterConfig.name,
          logGroupName: filterConfig.logGroupName,
          pattern: filterConfig.filterPattern,
          metricTransformation: {
            name: filterConfig.metricTransformation.metricName,
            namespace: filterConfig.metricTransformation.metricNamespace,
            value: filterConfig.metricTransformation.metricValue,
            defaultValue: filterConfig.metricTransformation.defaultValue,
            unit: filterConfig.metricTransformation.unit,
          },
        },
        { parent: this }
      );
    });
  }

  /**
   * Create CloudWatch dashboards
   */
  private createDashboards(dashboards: any[]): void {
    dashboards.forEach(dashboardConfig => {
      if (!dashboardConfig.dashboardBody && !dashboardConfig.widgets) {
        throw new Error(
          `Dashboard ${dashboardConfig.name} must have either dashboardBody or widgets`
        );
      }

      let dashboardBody = dashboardConfig.dashboardBody;
      if (!dashboardBody && dashboardConfig.widgets) {
        dashboardBody = JSON.stringify({
          widgets: dashboardConfig.widgets.map((widget: any) => ({
            type: widget.type,
            x: widget.x,
            y: widget.y,
            width: widget.width,
            height: widget.height,
            properties: widget.properties,
          })),
        });
      }

      this.dashboards[dashboardConfig.name] = new aws.cloudwatch.Dashboard(
        `${this.componentName}-dashboard-${dashboardConfig.name}`,
        {
          dashboardName: dashboardConfig.name,
          dashboardBody,
        },
        { parent: this }
      );
    });
  }

  /**
   * Add a log group dynamically
   */
  public addLogGroup(name: string, config: Partial<LogGroupConfig> = {}): aws.cloudwatch.LogGroup {
    const logGroupArgs: aws.cloudwatch.LogGroupArgs = {
      name,
      skipDestroy: config.skipDestroy ?? CLOUDWATCH_DEFAULTS.defaultSkipDestroy,
      tags: {
        ...this.defaultTags,
        ...config.tags,
      },
    };

    const retentionDays = config.retentionInDays ?? CLOUDWATCH_DEFAULTS.defaultRetentionDays;
    if (retentionDays !== LOG_RETENTION_DAYS.NEVER_EXPIRE) {
      logGroupArgs.retentionInDays = retentionDays;
    }

    if (config.kmsKeyId) {
      logGroupArgs.kmsKeyId = config.kmsKeyId;
    }

    this.logGroups[name] = new aws.cloudwatch.LogGroup(
      `${this.componentName}-lg-${name}`,
      logGroupArgs,
      { parent: this }
    );

    return this.logGroups[name];
  }

  /**
   * Add a metric alarm dynamically
   */
  public addMetricAlarm(
    name: string,
    metricName: string,
    namespace: string,
    threshold: number,
    comparisonOperator: string,
    options: Partial<MetricAlarmConfig> = {}
  ): aws.cloudwatch.MetricAlarm {
    const alarmConfig: MetricAlarmConfig = {
      name,
      metricName,
      namespace,
      threshold,
      comparisonOperator,
      statistic: options.statistic ?? CLOUDWATCH_DEFAULTS.defaultStatistic,
      period: options.period ?? CLOUDWATCH_DEFAULTS.defaultPeriod,
      evaluationPeriods: options.evaluationPeriods ?? CLOUDWATCH_DEFAULTS.defaultEvaluationPeriods,
      ...options,
    };

    // Validate alarm configuration
    const validationErrors = validateAlarmConfig(alarmConfig);
    if (validationErrors.length > 0) {
      throw new Error(`Invalid alarm configuration for ${name}: ${validationErrors.join(', ')}`);
    }

    const alarmActions = options.alarmActions ?? (this.snsTopic ? [this.snsTopic.arn] : []);

    const alarmArgs: aws.cloudwatch.MetricAlarmArgs = {
      name: alarmConfig.name,
      metricName: alarmConfig.metricName,
      namespace: alarmConfig.namespace,
      statistic: alarmConfig.statistic,
      period: alarmConfig.period,
      evaluationPeriods: alarmConfig.evaluationPeriods,
      threshold: alarmConfig.threshold,
      comparisonOperator: alarmConfig.comparisonOperator,
      alarmActions,
      actionsEnabled: alarmConfig.actionsEnabled ?? CLOUDWATCH_DEFAULTS.defaultActionsEnabled,
      tags: {
        ...this.defaultTags,
        ...options.tags,
      },
    };

    if (alarmConfig.description) {
      alarmArgs.alarmDescription = alarmConfig.description;
    }
    if (alarmConfig.dimensions) {
      alarmArgs.dimensions = alarmConfig.dimensions;
    }

    this.metricAlarms[name] = new aws.cloudwatch.MetricAlarm(
      `${this.componentName}-alarm-${name}`,
      alarmArgs,
      { parent: this }
    );

    return this.metricAlarms[name];
  }

  /**
   * Get the SNS topic ARN for notifications
   */
  public getNotificationTopicArn(): pulumi.Output<string> | undefined {
    return this.snsTopic?.arn;
  }
}
