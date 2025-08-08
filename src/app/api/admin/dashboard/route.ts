import { NextRequest, NextResponse } from 'next/server';
import { conversationManager } from '@/lib/whatsapp/session-manager';
import { trialManager } from '@/lib/business/trial-manager';
import { paymentManager } from '@/lib/business/payment-manager';
import { getSystemMetrics } from '@/lib/whatsapp/database-logger';

export async function GET(request: NextRequest) {
  try {
    // Get all dashboard data in parallel
    const [
      sessionStats,
      trialStats,
      paymentStats,
      systemMetrics,
      activeSessions,
      activeTrials,
      pendingPayments
    ] = await Promise.all([
      conversationManager.getSessionStats(),
      trialManager.getTrialStats(),
      paymentManager.getPaymentStats(),
      getSystemMetrics(),
      conversationManager.getActiveSessions(),
      trialManager.getActiveTrials(),
      paymentManager.getPendingPayments()
    ]);

    const dashboardData = {
      timestamp: new Date().toISOString(),
      
      // Session metrics
      sessions: {
        active: sessionStats.activeSessions,
        total: sessionStats.totalSessions,
        averageConversationLength: sessionStats.averageConversationLength,
        sessionsByStatus: sessionStats.sessionsByStatus
      },
      
      // Trial metrics
      trials: {
        total: trialStats.total,
        active: trialStats.expired,
        expired: trialStats.expired,
        converted: trialStats.converted,
        conversionRate: trialStats.conversionRate,
        averageMessagesPerTrial: trialStats.averageMessagesPerTrial
      },
      
      // Payment metrics
      payments: {
        total: paymentStats.total,
        completed: paymentStats.completed,
        pending: paymentStats.pending,
        failed: paymentStats.failed,
        totalRevenue: paymentStats.totalRevenue,
        averagePaymentAmount: paymentStats.averagePaymentAmount
      },
      
      // System metrics
      system: {
        dailyConversations: systemMetrics.dailyConversations,
        averageResponseTime: systemMetrics.averageResponseTime,
        successRate: systemMetrics.successRate,
        activeTrials: systemMetrics.activeTrials
      },
      
      // Real-time data
      realtime: {
        activeSessions: activeSessions.length,
        activeTrials: activeTrials.length,
        pendingPayments: pendingPayments.length
      },
      
      // Recent activity
      recentActivity: {
        activeSessions: activeSessions.slice(0, 10).map(session => ({
          sessionId: session.sessionId,
          phoneNumber: session.phoneNumber,
          businessName: session.businessContext.name,
          industry: session.businessContext.industry,
          trialStatus: session.businessContext.trialStatus,
          lastActivity: session.lastActivity,
          messageCount: session.conversationHistory.length
        })),
        activeTrials: activeTrials.slice(0, 10).map(trial => ({
          businessName: trial.business_name,
          phoneNumber: trial.phone_number,
          industry: trial.industry,
          trialStart: trial.trial_start,
          trialEnd: trial.trial_end,
          daysLeft: Math.ceil((new Date(trial.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
          messagesExchanged: trial.messages_exchanged
        })),
        pendingPayments: pendingPayments.slice(0, 10).map(payment => ({
          businessName: payment.business_name,
          phoneNumber: payment.phone_number,
          amount: payment.amount,
          currency: payment.currency,
          created: payment.created_at, // This will be timestamp in schema
          expires: payment.expires_at
        }))
      }
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}