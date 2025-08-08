import { ConversationSession, Message, BusinessContext } from './types';

export class ConversationManager {
  private activeSessions: Map<string, ConversationSession> = new Map();
  private sessionTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

  constructor() {
    // Start cleanup interval
    setInterval(() => this.cleanupExpiredSessions(), this.CLEANUP_INTERVAL);
  }

  /**
   * Create a new conversation session
   */
  createSession(phoneNumber: string): ConversationSession {
    const sessionId = `whatsapp_${phoneNumber}_${Date.now()}`;
    
    const session: ConversationSession = {
      sessionId,
      phoneNumber,
      agent: 'lexi',
      conversationHistory: [],
      businessContext: {
        trialStatus: 'prospect'
      },
      lastActivity: new Date(),
      startTime: new Date(),
      isActive: true
    };

    this.activeSessions.set(sessionId, session);
    this.setSessionTimeout(sessionId);
    
    console.log(`Created new session: ${sessionId} for phone: ${phoneNumber}`);
    return session;
  }

  /**
   * Get existing session by phone number
   */
  getSession(phoneNumber: string): ConversationSession | null {
    for (const [sessionId, session] of this.activeSessions) {
      if (session.phoneNumber === phoneNumber && session.isActive) {
        // Update last activity
        session.lastActivity = new Date();
        this.resetSessionTimeout(sessionId);
        return session;
      }
    }
    return null;
  }

  /**
   * Get session by session ID
   */
  getSessionById(sessionId: string): ConversationSession | null {
    const session = this.activeSessions.get(sessionId);
    if (session && session.isActive) {
      session.lastActivity = new Date();
      this.resetSessionTimeout(sessionId);
      return session;
    }
    return null;
  }

  /**
   * Update session with new data
   */
  updateSession(sessionId: string, updates: Partial<ConversationSession>): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    // Apply updates
    Object.assign(session, updates);
    session.lastActivity = new Date();
    
    this.resetSessionTimeout(sessionId);
    return true;
  }

  /**
   * Add message to conversation history
   */
  addMessageToSession(sessionId: string, message: Message): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    session.conversationHistory.push(message);
    session.lastActivity = new Date();
    
    this.resetSessionTimeout(sessionId);
    return true;
  }

  /**
   * End session (deactivate)
   */
  endSession(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    session.isActive = false;
    this.clearSessionTimeout(sessionId);
    
    console.log(`Ended session: ${sessionId}`);
    return true;
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): ConversationSession[] {
    return Array.from(this.activeSessions.values()).filter(session => session.isActive);
  }

  /**
   * Get session count
   */
  getActiveSessionCount(): number {
    return this.getActiveSessions().length;
  }

  /**
   * Set session timeout for automatic cleanup
   */
  private setSessionTimeout(sessionId: string): void {
    this.clearSessionTimeout(sessionId); // Clear any existing timeout
    
    const timeout = setTimeout(() => {
      console.log(`Session timeout: ${sessionId}`);
      this.endSession(sessionId);
    }, this.SESSION_TIMEOUT);

    this.sessionTimeouts.set(sessionId, timeout);
  }

  /**
   * Reset session timeout
   */
  private resetSessionTimeout(sessionId: string): void {
    this.setSessionTimeout(sessionId);
  }

  /**
   * Clear session timeout
   */
  private clearSessionTimeout(sessionId: string): void {
    const timeout = this.sessionTimeouts.get(sessionId);
    if (timeout) {
      clearTimeout(timeout);
      this.sessionTimeouts.delete(sessionId);
    }
  }

  /**
   * Cleanup expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.activeSessions) {
      if (!session.isActive || (now.getTime() - session.lastActivity.getTime()) > this.SESSION_TIMEOUT) {
        this.endSession(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired sessions`);
    }
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    totalSessions: number;
    activeSessions: number;
    averageConversationLength: number;
    sessionsByStatus: Record<string, number>;
  } {
    const sessions = Array.from(this.activeSessions.values());
    const activeSessions = sessions.filter(s => s.isActive);
    
    const sessionsByStatus = sessions.reduce((acc, session) => {
      const status = session.businessContext.trialStatus;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averageConversationLength = activeSessions.length > 0 
      ? activeSessions.reduce((sum, session) => sum + session.conversationHistory.length, 0) / activeSessions.length
      : 0;

    return {
      totalSessions: sessions.length,
      activeSessions: activeSessions.length,
      averageConversationLength,
      sessionsByStatus
    };
  }
}

// Export singleton instance
export const conversationManager = new ConversationManager();