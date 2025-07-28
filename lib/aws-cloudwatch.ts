import {
  PutMetricDataCommand,
  GetMetricStatisticsCommand,
  ListMetricsCommand,
  MetricDatum,
  StandardUnit,
} from "@aws-sdk/client-cloudwatch";
import { cloudWatchClient } from "./aws-config";

export interface MetricData {
  name: string;
  value: number;
  unit: StandardUnit;
  timestamp?: Date;
  dimensions?: Record<string, string>;
}

export interface MetricQuery {
  metricName: string;
  namespace: string;
  startTime: Date;
  endTime: Date;
  period: number;
  statistic: "Average" | "Sum" | "Maximum" | "Minimum" | "SampleCount";
  dimensions?: Record<string, string>;
}

export interface MetricStatistic {
  timestamp: Date;
  value: number;
}

export class CloudWatchService {
  private namespace: string;

  constructor(namespace = "SyncerticaEnterprise") {
    this.namespace = namespace;
  }

  async putMetric(metric: MetricData): Promise<void> {
    const metricDatum: MetricDatum = {
      MetricName: metric.name,
      Value: metric.value,
      Unit: metric.unit,
      Timestamp: metric.timestamp || new Date(),
    };

    if (metric.dimensions) {
      metricDatum.Dimensions = Object.entries(metric.dimensions).map(
        ([name, value]) => ({
          Name: name,
          Value: value,
        })
      );
    }

    const command = new PutMetricDataCommand({
      Namespace: this.namespace,
      MetricData: [metricDatum],
    });

    try {
      await cloudWatchClient.send(command);
    } catch (error) {
      console.error("Error putting metric:", error);
      throw error;
    }
  }

  async putMetrics(metrics: MetricData[]): Promise<void> {
    const metricData: MetricDatum[] = metrics.map((metric) => ({
      MetricName: metric.name,
      Value: metric.value,
      Unit: metric.unit,
      Timestamp: metric.timestamp || new Date(),
      ...(metric.dimensions && {
        Dimensions: Object.entries(metric.dimensions).map(([name, value]) => ({
          Name: name,
          Value: value,
        })),
      }),
    }));

    const command = new PutMetricDataCommand({
      Namespace: this.namespace,
      MetricData: metricData,
    });

    try {
      await cloudWatchClient.send(command);
    } catch (error) {
      console.error("Error putting metrics:", error);
      throw error;
    }
  }

  async getMetricStatistics(query: MetricQuery): Promise<MetricStatistic[]> {
    const command = new GetMetricStatisticsCommand({
      Namespace: query.namespace,
      MetricName: query.metricName,
      StartTime: query.startTime,
      EndTime: query.endTime,
      Period: query.period,
      Statistics: [query.statistic],
      ...(query.dimensions && {
        Dimensions: Object.entries(query.dimensions).map(([name, value]) => ({
          Name: name,
          Value: value,
        })),
      }),
    });

    try {
      const result = await cloudWatchClient.send(command);
      return (result.Datapoints || [])
        .map((datapoint) => ({
          timestamp: datapoint.Timestamp!,
          value: datapoint[query.statistic] || 0,
        }))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    } catch (error) {
      console.error("Error getting metric statistics:", error);
      throw error;
    }
  }

  async listMetrics(namespace?: string): Promise<string[]> {
    const command = new ListMetricsCommand({
      Namespace: namespace || this.namespace,
    });

    try {
      const result = await cloudWatchClient.send(command);
      return (result.Metrics || [])
        .map((metric) => metric.MetricName!)
        .filter(Boolean);
    } catch (error) {
      console.error("Error listing metrics:", error);
      throw error;
    }
  }

  // Application-specific metric helpers
  async recordPageView(page: string, userId?: string): Promise<void> {
    await this.putMetric({
      name: "PageViews",
      value: 1,
      unit: StandardUnit.Count,
      dimensions: {
        Page: page,
        ...(userId && { UserId: userId }),
      },
    });
  }

  async recordApiCall(
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number
  ): Promise<void> {
    await this.putMetrics([
      {
        name: "ApiCalls",
        value: 1,
        unit: StandardUnit.Count,
        dimensions: {
          Endpoint: endpoint,
          Method: method,
          StatusCode: statusCode.toString(),
        },
      },
      {
        name: "ApiResponseTime",
        value: duration,
        unit: StandardUnit.Milliseconds,
        dimensions: {
          Endpoint: endpoint,
          Method: method,
        },
      },
    ]);
  }

  async recordError(
    errorType: string,
    errorMessage: string,
    userId?: string
  ): Promise<void> {
    await this.putMetric({
      name: "Errors",
      value: 1,
      unit: StandardUnit.Count,
      dimensions: {
        ErrorType: errorType,
        ErrorMessage: errorMessage.substring(0, 100), // Limit length
        ...(userId && { UserId: userId }),
      },
    });
  }

  async recordUserActivity(
    activityType: string,
    userId: string
  ): Promise<void> {
    await this.putMetric({
      name: "UserActivity",
      value: 1,
      unit: StandardUnit.Count,
      dimensions: {
        ActivityType: activityType,
        UserId: userId,
      },
    });
  }

  async recordSystemHealth(
    component: string,
    status: "healthy" | "unhealthy",
    responseTime?: number
  ): Promise<void> {
    const metrics: MetricData[] = [
      {
        name: "SystemHealth",
        value: status === "healthy" ? 1 : 0,
        unit: "Count",
        dimensions: {
          Component: component,
          Status: status,
        },
      },
    ];

    if (responseTime !== undefined) {
      metrics.push({
        name: "ComponentResponseTime",
        value: responseTime,
        unit: StandardUnit.Milliseconds,
        dimensions: {
          Component: component,
        },
      });
    }

    await this.putMetrics(metrics);
  }
}

export const cloudWatch = new CloudWatchService();
