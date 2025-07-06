/**
 * CloudWatch Module Unit Tests
 */

import * as pulumi from '@pulumi/pulumi';
import {
  CloudWatchComponent,
  LOG_RETENTION_DAYS,
  COMPARISON_OPERATORS,
  STATISTICS,
  METRIC_NAMESPACES,
  COMMON_METRICS,
  CLOUDWATCH_DEFAULTS,
  createLogGroupConfig,
  createMetricAlarmConfig,
  createNotificationConfig,
  createAlarmTemplates,
  validateAlarmConfig,
  LOG_PATTERNS,
} from '../index';

// Mock Pulumi
pulumi.runtime.setMocks({
  newResource: (
    args: pulumi.runtime.MockResourceArgs
  ): {
    id: string;
    state: any;
  } => {
    const resourceName = args.name || 'test-resource';
    const resourceId = `${args.type.replace(':', '-')}-${resourceName}`;

    let state: any = { ...args.inputs };

    // Add specific mock states for different resource types
    if (args.type === 'aws:cloudwatch/logGroup:LogGroup') {
      state = {
        ...state,
        arn: `arn:aws:logs:us-east-1:123456789012:log-group:${state.name}`,
      };
    } else if (args.type === 'aws:cloudwatch/metricAlarm:MetricAlarm') {
      state = {
        ...state,
        arn: `arn:aws:cloudwatch:us-east-1:123456789012:alarm:${state.name}`,
      };
    } else if (args.type === 'aws:sns/topic:Topic') {
      state = {
        ...state,
        arn: `arn:aws:sns:us-east-1:123456789012:${state.name}`,
      };
    } else if (args.type === 'aws:cloudwatch/dashboard:Dashboard') {
      state = {
        ...state,
        dashboardArn: `arn:aws:cloudwatch::123456789012:dashboard/${state.dashboardName}`,
      };
    }

    return {
      id: resourceId,
      state,
    };
  },
  call: () => {
    return {};
  },
});

// Helper function to get resource state
const getResourceState = async (resource: any): Promise<any> => {
  const state: any = {};

  // Handle component resources differently from raw AWS resources
  if (resource.urn && typeof resource.urn.promise === 'function') {
    state.urn = await resource.urn.promise();
  }
  if (resource.id && typeof resource.id.promise === 'function') {
    state.id = await resource.id.promise();
  }

  // Get all resource properties
  for (const key in resource) {
    if (resource[key] && typeof resource[key].promise === 'function') {
      try {
        state[key] = await resource[key].promise();
      } catch {
        // Skip properties that can't be resolved
      }
    }
  }

  return state;
};

describe('CloudWatch Module - Constants and Types', () => {
  test('should export all required constants', () => {
    expect(LOG_RETENTION_DAYS.ONE_DAY).toBe(1);
    expect(LOG_RETENTION_DAYS.ONE_MONTH).toBe(30);
    expect(LOG_RETENTION_DAYS.NEVER_EXPIRE).toBe(0);

    expect(COMPARISON_OPERATORS.GREATER_THAN_THRESHOLD).toBe('GreaterThanThreshold');
    expect(COMPARISON_OPERATORS.LESS_THAN_THRESHOLD).toBe('LessThanThreshold');

    expect(STATISTICS.AVERAGE).toBe('Average');
    expect(STATISTICS.SUM).toBe('Sum');

    expect(METRIC_NAMESPACES.EC2).toBe('AWS/EC2');
    expect(METRIC_NAMESPACES.LAMBDA).toBe('AWS/Lambda');

    expect(COMMON_METRICS.EC2.CPU_UTILIZATION).toBe('CPUUtilization');
    expect(COMMON_METRICS.LAMBDA.ERRORS).toBe('Errors');
  });

  test('should have secure defaults', () => {
    expect(CLOUDWATCH_DEFAULTS.defaultRetentionDays).toBe(LOG_RETENTION_DAYS.THREE_MONTHS);
    expect(CLOUDWATCH_DEFAULTS.enableEncryption).toBe(true);
    expect(CLOUDWATCH_DEFAULTS.enableDetailedMonitoring).toBe(true);
    expect(CLOUDWATCH_DEFAULTS.defaultActionsEnabled).toBe(true);
    expect(CLOUDWATCH_DEFAULTS.defaultTags.Component).toBe('CloudWatch');
    expect(CLOUDWATCH_DEFAULTS.defaultTags.SecurityLevel).toBe('high');
  });
});

describe('CloudWatch Module - Helper Functions', () => {
  describe('createLogGroupConfig', () => {
    test('should create log group config with defaults', () => {
      const config = createLogGroupConfig('test-log-group');

      expect(config.name).toBe('test-log-group');
      expect(config.retentionInDays).toBe(CLOUDWATCH_DEFAULTS.defaultRetentionDays);
      expect(config.skipDestroy).toBe(CLOUDWATCH_DEFAULTS.defaultSkipDestroy);
      expect(config.tags).toEqual(expect.objectContaining(CLOUDWATCH_DEFAULTS.defaultTags));
    });

    test('should allow overriding defaults', () => {
      const config = createLogGroupConfig('test-log-group', {
        retentionInDays: LOG_RETENTION_DAYS.ONE_YEAR,
        skipDestroy: true,
        tags: { Environment: 'test' },
      });

      expect(config.retentionInDays).toBe(LOG_RETENTION_DAYS.ONE_YEAR);
      expect(config.skipDestroy).toBe(true);
      expect(config.tags).toEqual(
        expect.objectContaining({
          ...CLOUDWATCH_DEFAULTS.defaultTags,
          Environment: 'test',
        })
      );
    });
  });

  describe('createMetricAlarmConfig', () => {
    test('should create metric alarm config with defaults', () => {
      const config = createMetricAlarmConfig('test-alarm', 'CPUUtilization', 'AWS/EC2', 80);

      expect(config.name).toBe('test-alarm');
      expect(config.metricName).toBe('CPUUtilization');
      expect(config.namespace).toBe('AWS/EC2');
      expect(config.threshold).toBe(80);
      expect(config.comparisonOperator).toBe(COMPARISON_OPERATORS.GREATER_THAN_THRESHOLD);
      expect(config.statistic).toBe(CLOUDWATCH_DEFAULTS.defaultStatistic);
      expect(config.period).toBe(CLOUDWATCH_DEFAULTS.defaultPeriod);
      expect(config.evaluationPeriods).toBe(CLOUDWATCH_DEFAULTS.defaultEvaluationPeriods);
    });

    test('should allow custom comparison operator and options', () => {
      const config = createMetricAlarmConfig(
        'test-alarm',
        'FreeStorageSpace',
        'AWS/RDS',
        1000000,
        COMPARISON_OPERATORS.LESS_THAN_THRESHOLD,
        {
          description: 'Low free storage',
          period: 600,
          evaluationPeriods: 3,
          dimensions: { DBInstanceIdentifier: 'test-db' },
        }
      );

      expect(config.comparisonOperator).toBe(COMPARISON_OPERATORS.LESS_THAN_THRESHOLD);
      expect(config.description).toBe('Low free storage');
      expect(config.period).toBe(600);
      expect(config.evaluationPeriods).toBe(3);
      expect(config.dimensions).toEqual({ DBInstanceIdentifier: 'test-db' });
    });
  });

  describe('createNotificationConfig', () => {
    test('should create notification config with encryption enabled by default', () => {
      const config = createNotificationConfig();

      expect(config.enableEncryption).toBe(CLOUDWATCH_DEFAULTS.enableSnsEncryption);
    });

    test('should allow configuring endpoints', () => {
      const config = createNotificationConfig({
        topicName: 'alerts',
        emailEndpoints: ['admin@example.com'],
        smsEndpoints: ['+1234567890'],
      });

      expect(config.topicName).toBe('alerts');
      expect(config.emailEndpoints).toEqual(['admin@example.com']);
      expect(config.smsEndpoints).toEqual(['+1234567890']);
    });
  });

  describe('validateAlarmConfig', () => {
    test('should return no errors for valid config', () => {
      const config = createMetricAlarmConfig('valid-alarm', 'CPUUtilization', 'AWS/EC2', 80);

      const errors = validateAlarmConfig(config);
      expect(errors).toHaveLength(0);
    });

    test('should return errors for invalid config', () => {
      const invalidConfig = {
        name: '',
        metricName: '',
        namespace: '',
        threshold: undefined as any,
        comparisonOperator: '',
        statistic: '',
        period: 30, // Too low
        evaluationPeriods: 0, // Too low
        datapointsToAlarm: 5, // Higher than evaluation periods (2)
      } as any;

      const errors = validateAlarmConfig(invalidConfig);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors).toContain('Alarm name is required');
      expect(errors).toContain('Metric name is required');
      expect(errors).toContain('Namespace is required');
      expect(errors).toContain('Threshold is required');
      expect(errors).toContain('Period must be at least 60 seconds');
      expect(errors).toContain('Evaluation periods must be at least 1');
    });
  });

  describe('createAlarmTemplates', () => {
    test('should create EC2 alarms from template', () => {
      const alarms = createAlarmTemplates({
        ec2: {
          instanceId: 'i-1234567890abcdef0',
          enableCpuAlarm: true,
          cpuThreshold: 85,
        },
      });

      expect(alarms).toHaveLength(1);
      const cpuAlarm = alarms[0]!;
      expect(cpuAlarm).toBeDefined();
      expect(cpuAlarm.name).toBe('i-1234567890abcdef0-high-cpu');
      expect(cpuAlarm.metricName).toBe(COMMON_METRICS.EC2.CPU_UTILIZATION);
      expect(cpuAlarm.namespace).toBe(METRIC_NAMESPACES.EC2);
      expect(cpuAlarm.threshold).toBe(85);
      expect(cpuAlarm.dimensions).toEqual({ InstanceId: 'i-1234567890abcdef0' });
    });

    test('should create Lambda alarms from template', () => {
      const alarms = createAlarmTemplates({
        lambda: {
          functionName: 'my-function',
          enableErrorRateAlarm: true,
          enableDurationAlarm: true,
          durationThreshold: 10000,
        },
      });

      expect(alarms).toHaveLength(2);

      const errorAlarm = alarms.find(a => a.name.includes('error-rate'));
      expect(errorAlarm).toBeDefined();
      expect(errorAlarm!.metricName).toBe(COMMON_METRICS.LAMBDA.ERRORS);

      const durationAlarm = alarms.find(a => a.name.includes('duration'));
      expect(durationAlarm).toBeDefined();
      expect(durationAlarm!.threshold).toBe(10000);
    });
  });

  test('should provide log patterns', () => {
    expect(LOG_PATTERNS.ERROR).toBe('[ERROR]');
    expect(LOG_PATTERNS.HTTP_4XX).toBe('[status_code="4*"]');
    expect(LOG_PATTERNS.UNAUTHORIZED).toBe('unauthorized');
    expect(LOG_PATTERNS.JSON_ERROR).toBe('{ $.level = "ERROR" }');
  });
});

describe('CloudWatch Component', () => {
  test('should create CloudWatch component with minimal configuration', () => {
    const cloudwatch = new CloudWatchComponent('test-cloudwatch', {
      name: 'test-cloudwatch',
    });

    expect(cloudwatch).toBeInstanceOf(CloudWatchComponent);
    expect(cloudwatch.logGroups).toEqual({});
    expect(cloudwatch.metricAlarms).toEqual({});
    expect(cloudwatch.snsTopic).toBeUndefined();
  });

  test('should create log groups with secure defaults', async () => {
    const cloudwatch = new CloudWatchComponent('test-cloudwatch', {
      name: 'test-cloudwatch',
      logGroups: [
        {
          name: '/aws/lambda/test-function',
        },
        {
          name: '/aws/ecs/test-service',
          retentionInDays: LOG_RETENTION_DAYS.ONE_YEAR,
        },
      ],
    });

    expect(Object.keys(cloudwatch.logGroups)).toHaveLength(2);
    expect(cloudwatch.logGroups['/aws/lambda/test-function']).toBeDefined();
    expect(cloudwatch.logGroups['/aws/ecs/test-service']).toBeDefined();

    // Check log group state
    const logGroupState = await getResourceState(cloudwatch.logGroups['/aws/lambda/test-function']);
    expect(logGroupState.name).toBe('/aws/lambda/test-function');
    expect(logGroupState.retentionInDays).toBe(CLOUDWATCH_DEFAULTS.defaultRetentionDays);
  });

  test('should create metric alarms with validation', async () => {
    const cloudwatch = new CloudWatchComponent('test-cloudwatch', {
      name: 'test-cloudwatch',
      metricAlarms: [
        {
          name: 'high-cpu',
          metricName: 'CPUUtilization',
          namespace: 'AWS/EC2',
          statistic: 'Average',
          period: 300,
          evaluationPeriods: 2,
          threshold: 80,
          comparisonOperator: 'GreaterThanThreshold',
          dimensions: { InstanceId: 'i-1234567890abcdef0' },
        },
      ],
    });

    expect(Object.keys(cloudwatch.metricAlarms)).toHaveLength(1);
    expect(cloudwatch.metricAlarms['high-cpu']).toBeDefined();

    const alarmState = await getResourceState(cloudwatch.metricAlarms['high-cpu']);
    expect(alarmState.name).toBe('high-cpu');
    expect(alarmState.threshold).toBe(80);
    expect(alarmState.dimensions).toEqual({ InstanceId: 'i-1234567890abcdef0' });
  });

  test('should throw error for invalid alarm configuration', () => {
    expect(() => {
      new CloudWatchComponent('test-cloudwatch', {
        name: 'test-cloudwatch',
        metricAlarms: [
          {
            name: '',
            metricName: 'CPUUtilization',
            namespace: 'AWS/EC2',
            statistic: 'Average',
            period: 300,
            evaluationPeriods: 2,
            threshold: 80,
            comparisonOperator: 'GreaterThanThreshold',
          },
        ],
      });
    }).toThrow('Invalid alarm configuration');
  });

  test('should create SNS topic when notifications configured', async () => {
    const cloudwatch = new CloudWatchComponent('test-cloudwatch', {
      name: 'test-cloudwatch',
      notifications: {
        topicName: 'cloudwatch-alerts',
        enableEncryption: true,
      },
    });

    expect(cloudwatch.snsTopic).toBeDefined();

    const topicState = await getResourceState(cloudwatch.snsTopic!);
    expect(topicState.name).toBe('cloudwatch-alerts');
    expect(topicState.kmsMasterKeyId).toBe('alias/aws/sns');
  });

  test('should create dashboards from widgets', async () => {
    const cloudwatch = new CloudWatchComponent('test-cloudwatch', {
      name: 'test-cloudwatch',
      dashboards: [
        {
          name: 'test-dashboard',
          widgets: [
            {
              type: 'metric',
              x: 0,
              y: 0,
              width: 12,
              height: 6,
              properties: {
                metrics: [['AWS/EC2', 'CPUUtilization']],
                title: 'EC2 CPU Utilization',
              },
            },
          ],
        },
      ],
    });

    expect(Object.keys(cloudwatch.dashboards)).toHaveLength(1);
    expect(cloudwatch.dashboards['test-dashboard']).toBeDefined();

    const dashboardState = await getResourceState(cloudwatch.dashboards['test-dashboard']);
    expect(dashboardState.dashboardName).toBe('test-dashboard');
    expect(JSON.parse(dashboardState.dashboardBody)).toHaveProperty('widgets');
  });

  test('should create metric filters', async () => {
    const cloudwatch = new CloudWatchComponent('test-cloudwatch', {
      name: 'test-cloudwatch',
      logGroups: [{ name: '/aws/lambda/test-function' }],
      metricFilters: [
        {
          name: 'error-filter',
          logGroupName: '/aws/lambda/test-function',
          filterPattern: '[ERROR]',
          metricTransformation: {
            metricName: 'ErrorCount',
            metricNamespace: 'Custom/Lambda',
            metricValue: '1',
            defaultValue: 0,
          },
        },
      ],
    });

    expect(Object.keys(cloudwatch.metricFilters)).toHaveLength(1);
    expect(cloudwatch.metricFilters['error-filter']).toBeDefined();

    const filterState = await getResourceState(cloudwatch.metricFilters['error-filter']);
    expect(filterState.name).toBe('error-filter');
    expect(filterState.pattern).toBe('[ERROR]');
  });

  test('should handle never expire retention period', async () => {
    const cloudwatch = new CloudWatchComponent('test-cloudwatch', {
      name: 'test-cloudwatch',
      logGroups: [
        {
          name: '/aws/permanent-logs',
          retentionInDays: LOG_RETENTION_DAYS.NEVER_EXPIRE,
        },
      ],
    });

    const logGroupState = await getResourceState(cloudwatch.logGroups['/aws/permanent-logs']);
    expect(logGroupState.retentionInDays).toBeUndefined();
  });

  test('should allow adding log groups dynamically', async () => {
    const cloudwatch = new CloudWatchComponent('test-cloudwatch', {
      name: 'test-cloudwatch',
    });

    const logGroup = cloudwatch.addLogGroup('dynamic-log-group', {
      retentionInDays: LOG_RETENTION_DAYS.ONE_MONTH,
    });

    expect(cloudwatch.logGroups['dynamic-log-group']).toBe(logGroup);

    const logGroupState = await getResourceState(logGroup);
    expect(logGroupState.name).toBe('dynamic-log-group');
    expect(logGroupState.retentionInDays).toBe(LOG_RETENTION_DAYS.ONE_MONTH);
  });

  test('should allow adding metric alarms dynamically', async () => {
    const cloudwatch = new CloudWatchComponent('test-cloudwatch', {
      name: 'test-cloudwatch',
      notifications: {
        topicName: 'alerts',
      },
    });

    const alarm = cloudwatch.addMetricAlarm(
      'dynamic-alarm',
      'DatabaseConnections',
      'AWS/RDS',
      50,
      COMPARISON_OPERATORS.GREATER_THAN_THRESHOLD,
      {
        description: 'High DB connections',
        dimensions: { DBInstanceIdentifier: 'test-db' },
      }
    );

    expect(cloudwatch.metricAlarms['dynamic-alarm']).toBe(alarm);

    const alarmState = await getResourceState(alarm);
    expect(alarmState.name).toBe('dynamic-alarm');
    expect(alarmState.alarmDescription).toBe('High DB connections');
    expect(alarmState.dimensions).toEqual({ DBInstanceIdentifier: 'test-db' });
  });

  test('should get notification topic ARN', done => {
    const cloudwatch = new CloudWatchComponent('test-cloudwatch', {
      name: 'test-cloudwatch',
      notifications: {
        topicName: 'test-topic',
      },
    });

    const topicArn = cloudwatch.getNotificationTopicArn();
    expect(topicArn).toBeDefined();

    topicArn!.apply(arn => {
      expect(arn).toContain('arn:aws:sns');
      expect(arn).toContain('test-topic');
      done();
    });
  });

  test('should throw error for dashboard without body or widgets', () => {
    expect(() => {
      new CloudWatchComponent('test-cloudwatch', {
        name: 'test-cloudwatch',
        dashboards: [
          {
            name: 'invalid-dashboard',
          },
        ],
      });
    }).toThrow('Dashboard invalid-dashboard must have either dashboardBody or widgets');
  });

  test('should apply custom tags to all resources', async () => {
    const customTags = {
      Environment: 'test',
      Application: 'my-app',
    };

    const cloudwatch = new CloudWatchComponent('test-cloudwatch', {
      name: 'test-cloudwatch',
      tags: customTags,
      logGroups: [{ name: 'test-log-group' }],
      notifications: { topicName: 'test-topic' },
    });

    const logGroupState = await getResourceState(cloudwatch.logGroups['test-log-group']);
    expect(logGroupState.tags).toEqual(
      expect.objectContaining({
        ...CLOUDWATCH_DEFAULTS.defaultTags,
        ...customTags,
      })
    );

    const topicState = await getResourceState(cloudwatch.snsTopic!);
    expect(topicState.tags).toEqual(
      expect.objectContaining({
        ...CLOUDWATCH_DEFAULTS.defaultTags,
        ...customTags,
      })
    );
  });

  test('should use provided KMS key for log group encryption', async () => {
    const kmsKeyId = 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012';

    const cloudwatch = new CloudWatchComponent('test-cloudwatch', {
      name: 'test-cloudwatch',
      defaultKmsKeyId: kmsKeyId,
      logGroups: [{ name: 'encrypted-log-group' }],
    });

    const logGroupState = await getResourceState(cloudwatch.logGroups['encrypted-log-group']);
    expect(logGroupState.kmsKeyId).toBe(kmsKeyId);
  });
});
