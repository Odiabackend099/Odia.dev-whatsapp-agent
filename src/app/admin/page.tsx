'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  MessageSquare, 
  CreditCard, 
  TrendingUp, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react';

interface DashboardData {
  timestamp: string;
  sessions: {
    active: number;
    total: number;
    averageConversationLength: number;
    sessionsByStatus: Record<string, number>;
  };
  trials: {
    total: number;
    active: number;
    expired: number;
    converted: number;
    conversionRate: number;
    averageMessagesPerTrial: number;
  };
  payments: {
    total: number;
    completed: number;
    pending: number;
    failed: number;
    totalRevenue: number;
    averagePaymentAmount: number;
  };
  system: {
    dailyConversations: number;
    averageResponseTime: number;
    successRate: number;
    activeTrials: number;
  };
  realtime: {
    activeSessions: number;
    activeTrials: number;
    pendingPayments: number;
  };
  recentActivity: {
    activeSessions: Array<{
      sessionId: string;
      phoneNumber: string;
      businessName?: string;
      industry?: string;
      trialStatus: string;
      lastActivity: string;
      messageCount: number;
    }>;
    activeTrials: Array<{
      businessName: string;
      phoneNumber: string;
      industry?: string;
      trialStart: string;
      trialEnd: string;
      daysLeft: number;
      messagesExchanged: number;
    }>;
    pendingPayments: Array<{
      businessName: string;
      phoneNumber: string;
      amount: number;
      currency: string;
      created: string;
      expires: string;
    }>;
  };
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard');
      const dashboardData = await response.json();
      setData(dashboardData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;
  const formatNumber = (num: number) => num.toLocaleString();
  const formatPercentage = (num: number) => `${num.toFixed(1)}%`;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-500" />
          <p>Error loading dashboard data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">ODIA Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Last updated: {lastUpdated.toLocaleString()}
          </p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline">
          Refresh Data
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.realtime.activeSessions)}</div>
            <p className="text-xs text-muted-foreground">
              Total: {formatNumber(data.sessions.total)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.system.dailyConversations)}</div>
            <p className="text-xs text-muted-foreground">
              Success rate: {formatPercentage(data.system.successRate)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trials</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.realtime.activeTrials)}</div>
            <p className="text-xs text-muted-foreground">
              Conversion: {formatPercentage(data.trials.conversionRate)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.payments.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Completed: {data.payments.completed}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="trials">Trials</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Session Statistics</CardTitle>
                <CardDescription>Current session metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Active Sessions:</span>
                  <span className="font-semibold">{data.sessions.active}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Sessions:</span>
                  <span className="font-semibold">{data.sessions.total}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg. Conversation Length:</span>
                  <span className="font-semibold">{data.sessions.averageConversationLength.toFixed(1)} messages</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg. Response Time:</span>
                  <span className="font-semibold">{data.system.averageResponseTime.toFixed(0)}ms</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sessions by Status</CardTitle>
                <CardDescription>Breakdown by trial status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(data.sessions.sessionsByStatus).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center">
                    <span className="capitalize">{status}</span>
                    <Badge variant={status === 'prospect' ? 'secondary' : status === 'trial' ? 'default' : 'outline'}>
                      {count}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trials" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Trial Statistics</CardTitle>
                <CardDescription>Trial performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Trials:</span>
                  <span className="font-semibold">{data.trials.total}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Trials:</span>
                  <span className="font-semibold text-green-600">{data.trials.active}</span>
                </div>
                <div className="flex justify-between">
                  <span>Converted:</span>
                  <span className="font-semibold text-blue-600">{data.trials.converted}</span>
                </div>
                <div className="flex justify-between">
                  <span>Expired:</span>
                  <span className="font-semibold text-red-600">{data.trials.expired}</span>
                </div>
                <div className="flex justify-between">
                  <span>Conversion Rate:</span>
                  <span className="font-semibold">{formatPercentage(data.trials.conversionRate)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg. Messages/Trial:</span>
                  <span className="font-semibold">{data.trials.averageMessagesPerTrial.toFixed(1)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trial Value</CardTitle>
                <CardDescription>Business impact</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Monthly Revenue:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(data.trials.converted * 15000)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Potential Revenue:</span>
                  <span className="font-semibold">
                    {formatCurrency(data.trials.active * 15000)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Cost Savings:</span>
                  <span className="font-semibold text-blue-600">
                    {formatCurrency(data.trials.converted * 185000)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Statistics</CardTitle>
                <CardDescription>Payment processing metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Payments:</span>
                  <span className="font-semibold">{data.payments.total}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completed:</span>
                  <span className="font-semibold text-green-600">{data.payments.completed}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pending:</span>
                  <span className="font-semibold text-yellow-600">{data.payments.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span>Failed:</span>
                  <span className="font-semibold text-red-600">{data.payments.failed}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Revenue:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(data.payments.totalRevenue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Avg. Payment:</span>
                  <span className="font-semibold">
                    {formatCurrency(data.payments.averagePaymentAmount)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Status</CardTitle>
                <CardDescription>Current payment status breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Completed</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(data.payments.completed / data.payments.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm">{formatPercentage((data.payments.completed / data.payments.total) * 100)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Pending</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-600 h-2 rounded-full" 
                        style={{ width: `${(data.payments.pending / data.payments.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm">{formatPercentage((data.payments.pending / data.payments.total) * 100)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Failed</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full" 
                        style={{ width: `${(data.payments.failed / data.payments.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm">{formatPercentage((data.payments.failed / data.payments.total) * 100)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>Currently active conversations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {data.recentActivity.activeSessions.map((session) => (
                    <div key={session.sessionId} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="font-medium">{session.businessName || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">{session.phoneNumber}</div>
                      </div>
                      <div className="text-right">
                        <Badge variant={session.trialStatus === 'prospect' ? 'secondary' : 'default'}>
                          {session.trialStatus}
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          {session.messageCount} msgs
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Trials</CardTitle>
                <CardDescription>Currently active trials</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {data.recentActivity.activeTrials.map((trial, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="font-medium">{trial.businessName}</div>
                        <div className="text-sm text-muted-foreground">{trial.industry}</div>
                      </div>
                      <div className="text-right">
                        <Badge variant={trial.daysLeft > 3 ? 'default' : 'destructive'}>
                          {trial.daysLeft}d left
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          {trial.messagesExchanged} msgs
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pending Payments</CardTitle>
                <CardDescription>Awaiting payment processing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {data.recentActivity.pendingPayments.map((payment, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="font-medium">{payment.businessName}</div>
                        <div className="text-sm text-muted-foreground">{payment.phoneNumber}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(payment.amount)}</div>
                        <div className="text-xs text-muted-foreground">
                          {payment.currency}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}