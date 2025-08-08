import { db } from '@/lib/db';

export interface ConversationLogData {
  sessionId: string;
  phoneNumber: string;
  messageSid: string;
  userMessage: string;
  aiResponse: string;
  agent: string;
  responseTimeMs: number;
  businessName?: string;
  industry?: string;
  trialStatus: string;
}

export async function logConversation(data: ConversationLogData): Promise<void> {
  try {
    await db.whatsappConversation.create({
      data: {
        session_id: data.sessionId,
        phone_number: data.phoneNumber,
        message_sid: data.messageSid,
        user_message: data.userMessage,
        ai_response: data.aiResponse,
        agent: data.agent,
        response_time_ms: data.responseTimeMs,
        success: true,
        business_name: data.businessName,
        industry: data.industry,
        trial_status: data.trialStatus,
        timestamp: new Date()
      }
    });

    console.log(`Conversation logged for session: ${data.sessionId}`);
  } catch (error) {
    console.error('Error logging conversation:', error);
    throw error;
  }
}

export async function logError(
  sessionId: string,
  phoneNumber: string,
  messageSid: string,
  userMessage: string,
  errorMessage: string
): Promise<void> {
  try {
    await db.whatsappConversation.create({
      data: {
        session_id: sessionId,
        phone_number: phoneNumber,
        message_sid: messageSid,
        user_message: userMessage,
        ai_response: '',
        agent: 'lexi',
        success: false,
        error_message: errorMessage,
        timestamp: new Date()
      }
    });

    console.log(`Error logged for session: ${sessionId}`);
  } catch (error) {
    console.error('Error logging error:', error);
    throw error;
  }
}

export async function getConversationHistory(phoneNumber: string, limit: number = 50) {
  try {
    const conversations = await db.whatsappConversation.findMany({
      where: {
        phone_number: phoneNumber
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: limit
    });

    return conversations;
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    throw error;
  }
}

export async function getSystemMetrics() {
  try {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get today's conversation count
    const todayConversations = await db.whatsappConversation.count({
      where: {
        timestamp: {
          gte: yesterday
        }
      }
    });

    // Get average response time
    const responseTimeStats = await db.whatsappConversation.aggregate({
      where: {
        timestamp: {
          gte: yesterday
        },
        response_time_ms: {
          not: null
        }
      },
      _avg: {
        response_time_ms: true
      }
    });

    // Get success rate
    const successStats = await db.whatsappConversation.aggregate({
      where: {
        timestamp: {
          gte: yesterday
        }
      },
      _count: {
        _all: true
      },
      _where: {
        success: true
      }
    });

    const successRate = successStats._count._all > 0 
      ? (successStats._count._all / todayConversations) * 100 
      : 0;

    // Get active trials count
    const activeTrials = await db.businessTrial.count({
      where: {
        trial_status: 'active'
      }
    });

    return {
      dailyConversations: todayConversations,
      averageResponseTime: responseTimeStats._avg.response_time_ms || 0,
      successRate: Math.round(successRate * 100) / 100,
      activeTrials,
      timestamp: now
    };
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    throw error;
  }
}