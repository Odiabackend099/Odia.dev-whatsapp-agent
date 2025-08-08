import { db } from '@/lib/db';

export interface MetricData {
  metric_name: string;
  metric_value: number;
  metric_data?: any;
  recorded_at: Date;
}

export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  metricType?: string;
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  responseTime: number;
  errorRate: number;
  activeUsers: number;
  lastCheck: Date;
}

export class AnalyticsManager {
  private readonly CRITICAL_THRESHOLDS = {
    responseTime: 10000, // 10 seconds
    errorRate: 5, // 5%
    uptime: 99 // 99%
  };

  private readonly WARNING_THRESHOLDS = {
    responseTime: 5000, // 5 seconds
    errorRate: 2, // 2%
    uptime: 99.5 // 99.5%
  };

  async recordMetric(metricName: string, metricValue: number, metricData?: any): Promise<void> {
    try {
      await db.systemMetric.create({
        data: {
          metric_name: metricName,
          metric_value: metricValue,
          metric_data: metricData ? JSON.stringify(metricData) : null,
          recorded_at: new Date()
        }
      });

      console.log(`Recorded metric: ${metricName} = ${metricValue}`);
    } catch (error) {
      console.error('Error recording metric:', error);
      throw error;
    }
  }

  async getMetrics(filters?: AnalyticsFilters): Promise<MetricData[]> {
    try {
      const whereClause: any = {};
      
      if (filters?.startDate || filters?.endDate) {
        whereClause.recorded_at = {};
        if (filters.startDate) whereClause.recorded_at.gte = filters.startDate;
        if (filters.endDate) whereClause.recorded_at.lte = filters.endDate;
      }

      if (filters?.metricType) {
        whereClause.metric_name = {
          contains: filters.metricType
        };
      }

      const metrics = await db.systemMetric.findMany({
        where: whereClause,
        orderBy: {
          recorded_at: 'desc'
        },
        take: 1000 // Limit to prevent too much data
      });

      return metrics.map(metric => ({
        metric_name: metric.metric_name,
        metric_value: metric.metric_value,
        metric_data: metric.metric_data ? JSON.parse(metric.metric_data) : undefined,
        recorded_at: metric.recorded_at
      }));
    } catch (error) {
      console.error('Error fetching metrics:', error);
      throw error;
    }
  }

  async getMetricHistory(metricName: string, hours: number = 24): Promise<Array<{
    timestamp: Date;
    value: number;
  }>> {
    try {
      const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      const metrics = await db.systemMetric.findMany({
        where: {
          metric_name: metricName,
          recorded_at: {
            gte: startTime
          }
        },
        orderBy: {
          recorded_at: 'asc'
        }
      });

      return metrics.map(metric => ({
        timestamp: metric.recorded_at,
        value: metric.metric_value
      }));
    } catch (error) {
      console.error('Error fetching metric history:', error);
      throw error;
    }
  }

  async getAggregatedMetrics(metricName: string, period: 'hour' | 'day' | 'week' = 'day'): Promise<Array<{
    period: string;
    value: number;
    count: number;
  }>> {
    try {
      const startTime = new Date();
      
      switch (period) {
        case 'hour':
          startTime.setHours(startTime.getHours() - 24);
          break;
        case 'day':
          startTime.setDate(startTime.getDate() - 7);
          break;
        case 'week':
          startTime.setDate(startTime.getDate() - 30);
          break;
      }

      const metrics = await db.systemMetric.findMany({
        where: {
          metric_name: metricName,
          recorded_at: {
            gte: startTime
          }
        },
        orderBy: {
          recorded_at: 'asc'
        }
      });

      // Group by period
      const grouped = metrics.reduce((acc, metric) => {
        let key: string;
        const date = new Date(metric.recorded_at);
        
        switch (period) {
          case 'hour':
            key = date.toISOString().slice(0, 13) + ':00:00';
            break;
          case 'day':
            key = date.toISOString().slice(0, 10);
            break;
          case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            key = weekStart.toISOString().slice(0, 10);
            break;
        }

        if (!acc[key]) {
          acc[key] = { values: [], count: 0 };
        }
        acc[key].values.push(metric.metric_value);
        acc[key].count++;
        
        return acc;
      }, {} as Record<string, { values: number[]; count: number }>);

      return Object.entries(grouped).map(([period, data]) => ({
        period,
        value: data.values.reduce((sum, val) => sum + val, 0) / data.values.length,
        count: data.count
      }));
    } catch (error) {
      console.error('Error fetching aggregated metrics:', error);
      throw error;
    }
  }

  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Get recent metrics
      const [responseTimeMetrics, errorMetrics, activeSessions] = await Promise.all([
        db.systemMetric.findMany({
          where: {
            metric_name: 'response_time_avg',
            recorded_at: { gte: oneHourAgo }
          }
        }),
        db.systemMetric.findMany({
          where: {
            metric_name: 'error_rate',
            recorded_at: { gte: oneHourAgo }
          }
        }),
        db.systemMetric.findMany({
          where: {
            metric_name: 'active_sessions',
            recorded_at: { gte: oneHourAgo }
          }
        })
      ]);

      // Calculate averages
      const avgResponseTime = responseTimeMetrics.length > 0
        ? responseTimeMetrics.reduce((sum, m) => sum + m.metric_value, 0) / responseTimeMetrics.length
        : 0;

      const avgErrorRate = errorMetrics.length > 0
        ? errorMetrics.reduce((sum, m) => sum + m.metric_value, 0) / errorMetrics.length
        : 0;

      const currentActiveUsers = activeSessions.length > 0
        ? activeSessions[activeSessions.length - 1].metric_value
        : 0;

      // Determine status
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      
      if (avgResponseTime > this.CRITICAL_THRESHOLDS.responseTime ||
          avgErrorRate > this.CRITICAL_THRESHOLDS.errorRate) {
        status = 'critical';
      } else if (avgResponseTime > this.WARNING_THRESHOLDS.responseTime ||
                 avgErrorRate > this.WARNING_THRESHOLDS.errorRate) {
        status = 'warning';
      }

      return {
        status,
        uptime: 99.9, // Mock uptime - in real implementation, calculate from downtime logs
        responseTime: avgResponseTime,
        errorRate: avgErrorRate,
        activeUsers: currentActiveUsers,
        lastCheck: now
      };
    } catch (error) {
      console.error('Error getting system health:', error);
      throw error;
    }
  }

  async getBusinessInsights(): Promise<{
    topIndustries: Array<{ industry: string; count: number }>;
    conversionFunnel: {
      prospects: number;
      trials: number;
      paid: number;
    };
    revenueTrends: Array<{ date: string; revenue: number }>;
    customerAcquisitionCost: number;
    lifetimeValue: number;
  }> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Get top industries
      const industries = await db.businessTrial.groupBy({
        by: ['industry'],
        where: {
          trial_start: { gte: thirtyDaysAgo }
        },
        _count: {
          industry: true
        },
        orderBy: {
          _count: {
            industry: 'desc'
          }
        },
        take: 5
      });

      const topIndustries = industries.map(item => ({
        industry: item.industry || 'Unknown',
        count: item._count.industry
      }));

      // Get conversion funnel
      const [prospects, trials, paid] = await Promise.all([
        db.whatsappConversation.count({
          where: {
            trial_status: 'prospect',
            timestamp: { gte: thirtyDaysAgo }
          }
        }),
        db.businessTrial.count({
          where: {
            trial_start: { gte: thirtyDaysAgo }
          }
        }),
        db.payment.count({
          where: {
            status: 'completed',
            paid_at: { gte: thirtyDaysAgo }
          }
        })
      ]);

      // Get revenue trends
      const payments = await db.payment.findMany({
        where: {
          status: 'completed',
          paid_at: { gte: thirtyDaysAgo }
        },
        orderBy: {
          paid_at: 'asc'
        }
      });

      const revenueByDay = payments.reduce((acc, payment) => {
        const date = payment.paid_at?.toISOString().slice(0, 10) || new Date().toISOString().slice(0, 10);
        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date] += payment.amount;
        return acc;
      }, {} as Record<string, number>);

      const revenueTrends = Object.entries(revenueByDay).map(([date, revenue]) => ({
        date,
        revenue
      }));

      // Calculate CAC and LTV (simplified)
      const marketingSpend = 50000; // Mock marketing spend
      const customerAcquisitionCost = paid > 0 ? marketingSpend / paid : 0;
      const lifetimeValue = paid > 0 ? (payments.reduce((sum, p) => sum + p.amount, 0) / paid) * 12 : 0; // 12 months LTV

      return {
        topIndustries,
        conversionFunnel: {
          prospects,
          trials,
          paid
        },
        revenueTrends,
        customerAcquisitionCost,
        lifetimeValue
      };
    } catch (error) {
      console.error('Error getting business insights:', error);
      throw error;
    }
  }

  async cleanupOldMetrics(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
      
      const result = await db.systemMetric.deleteMany({
        where: {
          recorded_at: {
            lt: cutoffDate
          }
        }
      });

      console.log(`Cleaned up ${result.count} old metrics`);
      return result.count;
    } catch (error) {
      console.error('Error cleaning up old metrics:', error);
      throw error;
    }
  }

  // Scheduled metrics collection
  async collectSystemMetrics(): Promise<void> {
    try {
      const now = new Date();
      
      // Collect various system metrics
      const metrics = await Promise.all([
        this.getActiveSessionsCount(),
        this.getAverageResponseTime(),
        this.getErrorRate(),
        this.getDailyConversations(),
        this.getTrialConversionRate(),
        this.getDailyRevenue()
      ]);

      // Record all metrics
      await Promise.all([
        this.recordMetric('active_sessions', metrics[0]),
        this.recordMetric('response_time_avg', metrics[1]),
        this.recordMetric('error_rate', metrics[2]),
        this.recordMetric('daily_conversations', metrics[3]),
        this.recordMetric('trial_conversion_rate', metrics[4]),
        this.recordMetric('daily_revenue', metrics[5])
      ]);

      console.log('System metrics collected successfully');
    } catch (error) {
      console.error('Error collecting system metrics:', error);
      throw error;
    }
  }

  private async getActiveSessionsCount(): Promise<number> {
    try {
      // This would typically query the session manager
      // For now, return a mock value
      return Math.floor(Math.random() * 50) + 10;
    } catch (error) {
      return 0;
    }
  }

  private async getAverageResponseTime(): Promise<number> {
    try {
      // Get average response time from recent conversations
      const recentConversations = await db.whatsappConversation.findMany({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
          },
          response_time_ms: {
            not: null
          }
        },
        select: {
          response_time_ms: true
        }
      });

      if (recentConversations.length === 0) return 0;
      
      const totalTime = recentConversations.reduce((sum, conv) => sum + (conv.response_time_ms || 0), 0);
      return totalTime / recentConversations.length;
    } catch (error) {
      return 0;
    }
  }

  private async getErrorRate(): Promise<number> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const [total, errors] = await Promise.all([
        db.whatsappConversation.count({
          where: {
            timestamp: { gte: oneHourAgo }
          }
        }),
        db.whatsappConversation.count({
          where: {
            timestamp: { gte: oneHourAgo },
            success: false
          }
        })
      ]);

      return total > 0 ? (errors / total) * 100 : 0;
    } catch (error) {
      return 0;
    }
  }

  private async getDailyConversations(): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return await db.whatsappConversation.count({
        where: {
          timestamp: { gte: today }
        }
      });
    } catch (error) {
      return 0;
    }
  }

  private async getTrialConversionRate(): Promise<number> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const [trials, conversions] = await Promise.all([
        db.businessTrial.count({
          where: {
            trial_start: { gte: thirtyDaysAgo }
          }
        }),
        db.businessTrial.count({
          where: {
            trial_start: { gte: thirtyDaysAgo },
            converted: true
          }
        })
      ]);

      return trials > 0 ? (conversions / trials) * 100 : 0;
    } catch (error) {
      return 0;
    }
  }

  private async getDailyRevenue(): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const payments = await db.payment.findMany({
        where: {
          status: 'completed',
          paid_at: { gte: today }
        }
      });

      return payments.reduce((sum, payment) => sum + payment.amount, 0);
    } catch (error) {
      return 0;
    }
  }
}

// Export singleton instance
export const analyticsManager = new AnalyticsManager();