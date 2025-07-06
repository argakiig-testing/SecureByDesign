/**
 * CloudWatch Module Integration Tests
 *
 * Tests CloudWatch functionality against LocalStack
 */

import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  ListDashboardsCommand,
} from '@aws-sdk/client-cloudwatch';
import { SNSClient, ListTopicsCommand } from '@aws-sdk/client-sns';
import {
  localStackTest,
  skipIfLocalStackUnavailable,
  checkLocalStackStatus,
} from '../../../tests/helpers/localstack';
import {
  CloudWatchComponent,
  LOG_RETENTION_DAYS,
  COMPARISON_OPERATORS,
  STATISTICS,
  METRIC_NAMESPACES,
  COMMON_METRICS,
} from '../index';

// Mock Pulumi for integration tests
jest.mock('@pulumi/pulumi', () => {
  const actual = jest.requireActual('@pulumi/pulumi');
  return {
    ...actual,
    ComponentResource: class {
      constructor(_type: string, _name: string, _args: any, _opts?: any) {
        // Allow component creation without full Pulumi runtime
      }
      registerOutputs() {}
    },
  };
});

// AWS SDK clients configured for LocalStack
const cloudLogsClient = new CloudWatchLogsClient({
  region: 'us-east-1',
  endpoint: 'http://localhost:4566',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
});

const cloudWatchClient = new CloudWatchClient({
  region: 'us-east-1',
  endpoint: 'http://localhost:4566',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
});

const snsClient = new SNSClient({
  region: 'us-east-1',
  endpoint: 'http://localhost:4566',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
});

describe('CloudWatch Integration Tests', () => {
  beforeAll(async () => {
    const status = await checkLocalStackStatus();
    if (!status.isAvailable) {
      skipIfLocalStackUnavailable(status, 'CloudWatch integration tests');
      return;
    }

    // Check required services
    const requiredServices = ['cloudwatch', 'logs'];
    for (const service of requiredServices) {
      const serviceStatus = status.services[service as keyof typeof status.services];
      if (serviceStatus !== 'available') {
        skipIfLocalStackUnavailable(
          status,
          `CloudWatch integration tests require ${service} service`
        );
        return;
      }
    }
  });

  describe('Log Groups', () => {
    test(
      'should create log groups with proper configuration',
      localStackTest('cloudwatch-log-groups', ['logs'], async () => {
        // Create CloudWatch component with log groups
        const cloudwatch = new CloudWatchComponent('test-logs', {
          name: 'test-logs',
          logGroups: [
            {
              name: '/aws/lambda/test-function',
              retentionInDays: LOG_RETENTION_DAYS.ONE_WEEK,
            },
            {
              name: '/aws/ecs/test-service',
              retentionInDays: LOG_RETENTION_DAYS.ONE_MONTH,
            },
            {
              name: '/aws/permanent-logs',
              retentionInDays: LOG_RETENTION_DAYS.NEVER_EXPIRE,
            },
          ],
        });

        // Verify log groups were created
        expect(Object.keys(cloudwatch.logGroups)).toHaveLength(3);

        // Check LocalStack for actual log group creation
        const response = await cloudLogsClient.send(new DescribeLogGroupsCommand({}));
        const logGroups = response.logGroups || [];

        // Find our test log groups
        const lambdaLogGroup = logGroups.find(
          (lg: any) => lg.logGroupName === '/aws/lambda/test-function'
        );
        const ecsLogGroup = logGroups.find(
          (lg: any) => lg.logGroupName === '/aws/ecs/test-service'
        );
        const permanentLogGroup = logGroups.find(
          (lg: any) => lg.logGroupName === '/aws/permanent-logs'
        );

        expect(lambdaLogGroup).toBeDefined();
        expect(lambdaLogGroup?.retentionInDays).toBe(LOG_RETENTION_DAYS.ONE_WEEK);

        expect(ecsLogGroup).toBeDefined();
        expect(ecsLogGroup?.retentionInDays).toBe(LOG_RETENTION_DAYS.ONE_MONTH);

        expect(permanentLogGroup).toBeDefined();
        expect(permanentLogGroup?.retentionInDays).toBeUndefined(); // Never expire
      })
    );

    test(
      'should create log groups with default retention',
      localStackTest('cloudwatch-default-retention', ['logs'], async () => {
        const cloudwatch = new CloudWatchComponent('test-default-retention', {
          name: 'test-default-retention',
          logGroups: [
            {
              name: '/aws/lambda/default-retention',
            },
          ],
        });

        expect(Object.keys(cloudwatch.logGroups)).toHaveLength(1);

        // Check in LocalStack
        const response = await cloudLogsClient.send(
          new DescribeLogGroupsCommand({
            logGroupNamePrefix: '/aws/lambda/default-retention',
          })
        );

        const logGroup = response.logGroups?.[0];
        expect(logGroup).toBeDefined();
        expect(logGroup?.retentionInDays).toBe(90); // Default 3 months
      })
    );
  });

  describe('Metric Alarms', () => {
    test(
      'should create metric alarms with proper configuration',
      localStackTest('cloudwatch-metric-alarms', ['cloudwatch'], async () => {
        const cloudwatch = new CloudWatchComponent('test-alarms', {
          name: 'test-alarms',
          metricAlarms: [
            {
              name: 'high-cpu-alarm',
              metricName: COMMON_METRICS.EC2.CPU_UTILIZATION,
              namespace: METRIC_NAMESPACES.EC2,
              statistic: STATISTICS.AVERAGE,
              period: 300,
              evaluationPeriods: 2,
              threshold: 80,
              comparisonOperator: COMPARISON_OPERATORS.GREATER_THAN_THRESHOLD,
              dimensions: { InstanceId: 'i-1234567890abcdef0' },
              description: 'High CPU utilization alarm',
            },
            {
              name: 'low-disk-space-alarm',
              metricName: 'FreeStorageSpace',
              namespace: METRIC_NAMESPACES.RDS,
              statistic: STATISTICS.AVERAGE,
              period: 300,
              evaluationPeriods: 1,
              threshold: 1000000000, // 1GB
              comparisonOperator: COMPARISON_OPERATORS.LESS_THAN_THRESHOLD,
              dimensions: { DBInstanceIdentifier: 'test-db' },
            },
          ],
        });

        expect(Object.keys(cloudwatch.metricAlarms)).toHaveLength(2);

        // Check alarms in LocalStack
        const response = await cloudWatchClient.send(new DescribeAlarmsCommand({}));
        const alarms = response.MetricAlarms || [];

        const cpuAlarm = alarms.find((alarm: any) => alarm.AlarmName === 'high-cpu-alarm');
        expect(cpuAlarm).toBeDefined();
        expect(cpuAlarm?.MetricName).toBe(COMMON_METRICS.EC2.CPU_UTILIZATION);
        expect(cpuAlarm?.Namespace).toBe(METRIC_NAMESPACES.EC2);
        expect(cpuAlarm?.Threshold).toBe(80);
        expect(cpuAlarm?.ComparisonOperator).toBe(COMPARISON_OPERATORS.GREATER_THAN_THRESHOLD);
        expect(cpuAlarm?.Dimensions).toEqual([
          { Name: 'InstanceId', Value: 'i-1234567890abcdef0' },
        ]);

        const diskAlarm = alarms.find((alarm: any) => alarm.AlarmName === 'low-disk-space-alarm');
        expect(diskAlarm).toBeDefined();
        expect(diskAlarm?.MetricName).toBe('FreeStorageSpace');
        expect(diskAlarm?.Namespace).toBe(METRIC_NAMESPACES.RDS);
        expect(diskAlarm?.Threshold).toBe(1000000000);
        expect(diskAlarm?.ComparisonOperator).toBe(COMPARISON_OPERATORS.LESS_THAN_THRESHOLD);
      })
    );

    test(
      'should handle alarm validation errors',
      localStackTest('cloudwatch-alarm-validation', ['cloudwatch'], async () => {
        expect(() => {
          new CloudWatchComponent('test-invalid-alarm', {
            name: 'test-invalid-alarm',
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
      })
    );
  });

  describe('SNS Notifications', () => {
    test(
      'should create SNS topic for notifications',
      localStackTest('cloudwatch-sns-notifications', ['sns'], async () => {
        const cloudwatch = new CloudWatchComponent('test-notifications', {
          name: 'test-notifications',
          notifications: {
            topicName: 'cloudwatch-alerts',
            enableEncryption: true,
          },
        });

        expect(cloudwatch.snsTopic).toBeDefined();

        // Check SNS topic in LocalStack
        const response = await snsClient.send(new ListTopicsCommand({}));
        const topics = response.Topics || [];

        const alertsTopic = topics.find((topic: any) =>
          topic.TopicArn?.includes('cloudwatch-alerts')
        );
        expect(alertsTopic).toBeDefined();
        expect(alertsTopic?.TopicArn).toContain('cloudwatch-alerts');
      })
    );

    test(
      'should create alarms with SNS notifications',
      localStackTest('cloudwatch-alarm-sns', ['cloudwatch', 'sns'], async () => {
        new CloudWatchComponent('test-alarm-notifications', {
          name: 'test-alarm-notifications',
          notifications: {
            topicName: 'alarm-notifications',
          },
          metricAlarms: [
            {
              name: 'test-notification-alarm',
              metricName: 'CPUUtilization',
              namespace: 'AWS/EC2',
              statistic: 'Average',
              period: 300,
              evaluationPeriods: 2,
              threshold: 90,
              comparisonOperator: 'GreaterThanThreshold',
            },
          ],
        });

        // Check that alarm has SNS action
        const response = await cloudWatchClient.send(
          new DescribeAlarmsCommand({
            AlarmNames: ['test-notification-alarm'],
          })
        );

        const alarm = response.MetricAlarms?.[0];
        expect(alarm).toBeDefined();
        expect(alarm?.AlarmActions).toBeDefined();
        expect(alarm?.AlarmActions?.length).toBeGreaterThan(0);
        expect(alarm?.AlarmActions?.[0]).toContain('alarm-notifications');
      })
    );
  });

  describe('Dashboards', () => {
    test(
      'should create dashboards with widgets',
      localStackTest('cloudwatch-dashboards', ['cloudwatch'], async () => {
        const cloudwatch = new CloudWatchComponent('test-dashboards', {
          name: 'test-dashboards',
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
                    region: 'us-east-1',
                  },
                },
              ],
            },
          ],
        });

        expect(Object.keys(cloudwatch.dashboards)).toHaveLength(1);

        // Check dashboard in LocalStack
        const response = await cloudWatchClient.send(new ListDashboardsCommand({}));
        const dashboards = response.DashboardEntries || [];

        const testDashboard = dashboards.find(
          (dashboard: any) => dashboard.DashboardName === 'test-dashboard'
        );
        expect(testDashboard).toBeDefined();
        expect(testDashboard?.DashboardName).toBe('test-dashboard');
      })
    );

    test(
      'should create dashboards with raw JSON body',
      localStackTest('cloudwatch-json-dashboard', ['cloudwatch'], async () => {
        const dashboardBody = JSON.stringify({
          widgets: [
            {
              type: 'metric',
              x: 0,
              y: 0,
              width: 12,
              height: 6,
              properties: {
                metrics: [['AWS/Lambda', 'Invocations']],
                title: 'Lambda Invocations',
              },
            },
          ],
        });

        const cloudwatch = new CloudWatchComponent('test-json-dashboard', {
          name: 'test-json-dashboard',
          dashboards: [
            {
              name: 'json-dashboard',
              dashboardBody,
            },
          ],
        });

        expect(Object.keys(cloudwatch.dashboards)).toHaveLength(1);

        const response = await cloudWatchClient.send(new ListDashboardsCommand({}));
        const dashboards = response.DashboardEntries || [];

        const jsonDashboard = dashboards.find(
          (dashboard: any) => dashboard.DashboardName === 'json-dashboard'
        );
        expect(jsonDashboard).toBeDefined();
      })
    );

    test(
      'should throw error for invalid dashboard config',
      localStackTest('cloudwatch-invalid-dashboard', ['cloudwatch'], async () => {
        expect(() => {
          new CloudWatchComponent('test-invalid-dashboard', {
            name: 'test-invalid-dashboard',
            dashboards: [
              {
                name: 'invalid-dashboard',
                // No body or widgets
              },
            ],
          });
        }).toThrow('Dashboard invalid-dashboard must have either dashboardBody or widgets');
      })
    );
  });

  describe('Dynamic Resource Addition', () => {
    test(
      'should allow adding log groups dynamically',
      localStackTest('cloudwatch-dynamic-logs', ['logs'], async () => {
        const cloudwatch = new CloudWatchComponent('test-dynamic-logs', {
          name: 'test-dynamic-logs',
        });

        // Add log group dynamically
        const logGroup = cloudwatch.addLogGroup('dynamic-log-group', {
          retentionInDays: LOG_RETENTION_DAYS.TWO_WEEKS,
        });

        expect(cloudwatch.logGroups['dynamic-log-group']).toBe(logGroup);

        // Check in LocalStack
        const response = await cloudLogsClient.send(
          new DescribeLogGroupsCommand({
            logGroupNamePrefix: 'dynamic-log-group',
          })
        );

        const createdLogGroup = response.logGroups?.[0];
        expect(createdLogGroup).toBeDefined();
        expect(createdLogGroup?.retentionInDays).toBe(LOG_RETENTION_DAYS.TWO_WEEKS);
      })
    );

    test(
      'should allow adding metric alarms dynamically',
      localStackTest('cloudwatch-dynamic-alarms', ['cloudwatch', 'sns'], async () => {
        const cloudwatch = new CloudWatchComponent('test-dynamic-alarms', {
          name: 'test-dynamic-alarms',
          notifications: {
            topicName: 'dynamic-alerts',
          },
        });

        // Add alarm dynamically
        const alarm = cloudwatch.addMetricAlarm(
          'dynamic-alarm',
          'DatabaseConnections',
          'AWS/RDS',
          50,
          COMPARISON_OPERATORS.GREATER_THAN_THRESHOLD,
          {
            description: 'High database connections',
            dimensions: { DBInstanceIdentifier: 'test-db' },
          }
        );

        expect(cloudwatch.metricAlarms['dynamic-alarm']).toBe(alarm);

        // Check in LocalStack
        const response = await cloudWatchClient.send(
          new DescribeAlarmsCommand({
            AlarmNames: ['dynamic-alarm'],
          })
        );

        const createdAlarm = response.MetricAlarms?.[0];
        expect(createdAlarm).toBeDefined();
        expect(createdAlarm?.MetricName).toBe('DatabaseConnections');
        expect(createdAlarm?.Threshold).toBe(50);
        expect(createdAlarm?.AlarmDescription).toBe('High database connections');
      })
    );
  });

  describe('Complex Scenarios', () => {
    test(
      'should create comprehensive monitoring setup',
      localStackTest('cloudwatch-comprehensive', ['logs', 'cloudwatch', 'sns'], async () => {
        const cloudwatch = new CloudWatchComponent('comprehensive-monitoring', {
          name: 'comprehensive-monitoring',
          notifications: {
            topicName: 'comprehensive-alerts',
            enableEncryption: true,
          },
          logGroups: [
            {
              name: '/aws/lambda/api-handler',
              retentionInDays: LOG_RETENTION_DAYS.ONE_MONTH,
            },
            {
              name: '/aws/ecs/web-service',
              retentionInDays: LOG_RETENTION_DAYS.THREE_MONTHS,
            },
          ],
          metricAlarms: [
            {
              name: 'lambda-error-rate',
              metricName: COMMON_METRICS.LAMBDA.ERRORS,
              namespace: METRIC_NAMESPACES.LAMBDA,
              statistic: STATISTICS.SUM,
              period: 300,
              evaluationPeriods: 2,
              threshold: 5,
              comparisonOperator: COMPARISON_OPERATORS.GREATER_THAN_THRESHOLD,
              dimensions: { FunctionName: 'api-handler' },
            },
            {
              name: 'lambda-duration',
              metricName: COMMON_METRICS.LAMBDA.DURATION,
              namespace: METRIC_NAMESPACES.LAMBDA,
              statistic: STATISTICS.AVERAGE,
              period: 300,
              evaluationPeriods: 3,
              threshold: 10000,
              comparisonOperator: COMPARISON_OPERATORS.GREATER_THAN_THRESHOLD,
              dimensions: { FunctionName: 'api-handler' },
            },
          ],
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
                    metrics: [
                      ['AWS/Lambda', 'Invocations', 'FunctionName', 'api-handler'],
                      ['.', 'Errors', '.', '.'],
                      ['.', 'Duration', '.', '.'],
                    ],
                    title: 'Lambda Metrics',
                    region: 'us-east-1',
                  },
                },
              ],
            },
          ],
        });

        // Verify all components were created
        expect(Object.keys(cloudwatch.logGroups)).toHaveLength(2);
        expect(Object.keys(cloudwatch.metricAlarms)).toHaveLength(2);
        expect(Object.keys(cloudwatch.dashboards)).toHaveLength(1);
        expect(cloudwatch.snsTopic).toBeDefined();

        // Verify in LocalStack
        const [logGroupsResponse, alarmsResponse, dashboardsResponse, topicsResponse] =
          await Promise.all([
            cloudLogsClient.send(new DescribeLogGroupsCommand({})),
            cloudWatchClient.send(new DescribeAlarmsCommand({})),
            cloudWatchClient.send(new ListDashboardsCommand({})),
            snsClient.send(new ListTopicsCommand({})),
          ]);

        // Check log groups
        const logGroups = logGroupsResponse.logGroups || [];
        expect(
          logGroups.find((lg: any) => lg.logGroupName === '/aws/lambda/api-handler')
        ).toBeDefined();
        expect(
          logGroups.find((lg: any) => lg.logGroupName === '/aws/ecs/web-service')
        ).toBeDefined();

        // Check alarms
        const alarms = alarmsResponse.MetricAlarms || [];
        expect(alarms.find((a: any) => a.AlarmName === 'lambda-error-rate')).toBeDefined();
        expect(alarms.find((a: any) => a.AlarmName === 'lambda-duration')).toBeDefined();

        // Check dashboard
        const dashboards = dashboardsResponse.DashboardEntries || [];
        expect(
          dashboards.find((d: any) => d.DashboardName === 'application-overview')
        ).toBeDefined();

        // Check SNS topic
        const topics = topicsResponse.Topics || [];
        expect(topics.find((t: any) => t.TopicArn?.includes('comprehensive-alerts'))).toBeDefined();
      })
    );
  });
});
