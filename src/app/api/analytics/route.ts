import { NextRequest, NextResponse } from 'next/server';
import { analyticsManager } from '@/lib/analytics/analytics-manager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
    const period = searchParams.get('period') || 'day';

    switch (type) {
      case 'overview':
        const [systemHealth, businessInsights] = await Promise.all([
          analyticsManager.getSystemHealth(),
          analyticsManager.getBusinessInsights()
        ]);

        return NextResponse.json({
          systemHealth,
          businessInsights,
          timestamp: new Date().toISOString()
        });

      case 'metrics':
        const metricName = searchParams.get('metric');
        if (!metricName) {
          return NextResponse.json(
            { error: 'Metric name is required' },
            { status: 400 }
          );
        }

        const hours = parseInt(searchParams.get('hours') || '24');
        const history = await analyticsManager.getMetricHistory(metricName, hours);
        
        return NextResponse.json({
          metricName,
          history,
          period: `${hours}h`,
          timestamp: new Date().toISOString()
        });

      case 'aggregated':
        const aggMetricName = searchParams.get('metric');
        if (!aggMetricName) {
          return NextResponse.json(
            { error: 'Metric name is required' },
            { status: 400 }
          );
        }

        const aggPeriod = searchParams.get('period') as 'hour' | 'day' | 'week' || 'day';
        const aggregated = await analyticsManager.getAggregatedMetrics(aggMetricName, aggPeriod);
        
        return NextResponse.json({
          metricName: aggMetricName,
          period: aggPeriod,
          data: aggregated,
          timestamp: new Date().toISOString()
        });

      case 'health':
        const health = await analyticsManager.getSystemHealth();
        return NextResponse.json({
          health,
          timestamp: new Date().toISOString()
        });

      case 'insights':
        const insights = await analyticsManager.getBusinessInsights();
        return NextResponse.json({
          insights,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid analytics type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'collect-metrics':
        await analyticsManager.collectSystemMetrics();
        return NextResponse.json({ 
          message: 'Metrics collected successfully',
          timestamp: new Date().toISOString()
        });

      case 'cleanup':
        const daysToKeep = params.daysToKeep || 30;
        const cleanedCount = await analyticsManager.cleanupOldMetrics(daysToKeep);
        return NextResponse.json({ 
          message: `Cleaned up ${cleanedCount} old metrics`,
          timestamp: new Date().toISOString()
        });

      case 'record-metric':
        const { metricName, metricValue, metricData } = params;
        if (!metricName || metricValue === undefined) {
          return NextResponse.json(
            { error: 'Metric name and value are required' },
            { status: 400 }
          );
        }

        await analyticsManager.recordMetric(metricName, metricValue, metricData);
        return NextResponse.json({ 
          message: 'Metric recorded successfully',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing analytics request:', error);
    return NextResponse.json(
      { error: 'Failed to process analytics request' },
      { status: 500 }
    );
  }
}